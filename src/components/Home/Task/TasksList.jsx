import TaskTable from "./Table";

const TasksList = ({ isModalOpen }) => {
    return (
        <div className="m-3">
            <div className="overflow-x-auto ">
                <TaskTable isModalOpen={isModalOpen} />
            </div>
        </div>
    );
};

export default TasksList;