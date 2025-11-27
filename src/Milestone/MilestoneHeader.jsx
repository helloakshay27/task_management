import { useEffect, useState } from "react";
import TaskActions from "../components/Home/TaskActions";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProjectDetails } from "../redux/slices/projectSlice";

// Define available columns for Milestone table - must match allColumns in MilestoneList.jsx
const MILESTONE_TABLE_COLUMNS = [
    { id: "id", label: "Milestone ID", key: "id" },
    { id: "title", label: "Milestone Title", key: "title" },
    { id: "status", label: "Status", key: "status" },
    { id: "owner", label: "Owner", key: "owner" },
    { id: "tasks", label: "Tasks", key: "tasks" },
    { id: "startDate", label: "Start Date", key: "startDate" },
    { id: "endDate", label: "End Date", key: "endDate" },
    { id: "actions", label: "Actions", key: "actions" },
];

// Define available columns for Gantt view
const MILESTONE_GANTT_COLUMNS = [
    { id: "actions", label: "Actions", key: "actions" },
    { id: "text", label: "Id", key: "text" },
    { id: "title", label: "Milestone / Task Title", key: "title" },
    { id: "progress", label: "Progress", key: "progress" },
    { id: "status", label: "Status", key: "status" },
];

const MilestoneHeader = ({ selectedType, setSelectedType, searchQuery, setSearchQuery, onColumnsChange, selectedColumns }) => {
    const token = localStorage.getItem("token");
    const { id } = useParams();
    const dispatch = useDispatch();

    const { fetchProjectDetails: project } = useSelector(state => state.fetchProjectDetails)

    useEffect(() => {
        dispatch(fetchProjectDetails({ token, id }))
    }, [dispatch])

    const handleColumnsChange = (columns) => {
        if (onColumnsChange) {
            onColumnsChange(columns);
        }
    };
    
    // Determine which columns to show based on selected type
    const availableColumnsForType = selectedType === "Gantt" ? MILESTONE_GANTT_COLUMNS : MILESTONE_TABLE_COLUMNS;

    return (
        <div>
            <h3 className="text-[11px] text-gray-400 mx-6 my-4">{project.title} / Milestones</h3>
            <hr className="border border-gray-200" />

            <TaskActions
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                addType={"Milestone"}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onColumnsChange={handleColumnsChange}
                availableColumns={availableColumnsForType}
            />
        </div>
    );
};

export default MilestoneHeader;