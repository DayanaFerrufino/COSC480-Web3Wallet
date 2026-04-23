// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TaskBounty {
    enum TaskStatus { Open, Claimed, Submitted, Completed, Cancelled }

    event TaskPosted(uint256 indexed id, address indexed poster, string title, uint256 bounty);
    event TaskClaimed(uint256 indexed id, address indexed worker);
    event WorkSubmitted(uint256 indexed id, address indexed worker, string proofUrl);
    event TaskCompleted(uint256 indexed id, address indexed worker, uint256 bounty);
    event TaskCancelled(uint256 indexed id);

    struct Task {
        uint256 id;
        address poster;
        address worker;
        string title;
        string description;
        string proofUrl;
        uint256 bounty;
        TaskStatus status;
        uint256 createdAt;
    }

    uint256 public taskCount;
    mapping(uint256 => Task) public tasks;

    // Post a new task with ETH bounty locked in contract
    function postTask(string memory title, string memory description) public payable {
        require(msg.value > 0, "Bounty must be greater than 0");
        require(bytes(title).length > 0, "Title cannot be empty");

        taskCount++;
        tasks[taskCount] = Task({
            id: taskCount,
            poster: msg.sender,
            worker: address(0),
            title: title,
            description: description,
            proofUrl: "",
            bounty: msg.value,
            status: TaskStatus.Open,
            createdAt: block.timestamp
        });

        emit TaskPosted(taskCount, msg.sender, title, msg.value);
    }

    // Worker claims an open task
    function claimTask(uint256 taskId) public {
        Task storage task = tasks[taskId];
        require(task.id != 0, "Task does not exist");
        require(task.status == TaskStatus.Open, "Task is not open");
        require(task.poster != msg.sender, "Poster cannot claim their own task");

        task.worker = msg.sender;
        task.status = TaskStatus.Claimed;

        emit TaskClaimed(taskId, msg.sender);
    }

    // Worker submits proof of work
    function submitWork(uint256 taskId, string memory proofUrl) public {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.Claimed, "Task is not claimed");
        require(task.worker == msg.sender, "Only the assigned worker can submit");
        require(bytes(proofUrl).length > 0, "Proof URL cannot be empty");

        task.proofUrl = proofUrl;
        task.status = TaskStatus.Submitted;

        emit WorkSubmitted(taskId, msg.sender, proofUrl);
    }

    // Poster approves work and releases bounty to worker
    function approveWork(uint256 taskId) public {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.Submitted, "No work submitted yet");
        require(task.poster == msg.sender, "Only the poster can approve");

        task.status = TaskStatus.Completed;
        uint256 payout = task.bounty;
        task.bounty = 0;

        payable(task.worker).transfer(payout);

        emit TaskCompleted(taskId, task.worker, payout);
    }

    // Poster cancels task if it's still Open (gets refund)
    function cancelTask(uint256 taskId) public {
        Task storage task = tasks[taskId];
        require(task.poster == msg.sender, "Only the poster can cancel");
        require(task.status == TaskStatus.Open, "Can only cancel open tasks");

        task.status = TaskStatus.Cancelled;
        uint256 refund = task.bounty;
        task.bounty = 0;

        payable(task.poster).transfer(refund);

        emit TaskCancelled(taskId);
    }

    // Read all tasks (helper for frontend)
    function getTask(uint256 taskId) public view returns (Task memory) {
        require(tasks[taskId].id != 0, "Task does not exist");
        return tasks[taskId];
    }
}
