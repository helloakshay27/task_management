import TaskTable from "./Table";

const TasksList = ({ isModalOpen, searchQuery, selectedColumns }) => {
    return (
        <div className="m-3">
            <div className="overflow-x-auto ">
                <TaskTable isModalOpen={isModalOpen} searchQuery={searchQuery} selectedColumns={selectedColumns} />
            </div>
        </div>
    );
};

export default TasksList;