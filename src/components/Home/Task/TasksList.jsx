import TaskTable from "./Table";

const TasksList = ({ isModalOpen, searchQuery }) => {
    return (
        <div className="m-3">
            <div className="overflow-x-auto ">
                <TaskTable isModalOpen={isModalOpen} searchQuery={searchQuery} />
            </div>
        </div>
    );
};

export default TasksList;