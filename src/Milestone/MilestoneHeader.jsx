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
                availableColumns={MILESTONE_TABLE_COLUMNS}
            />
        </div>
    );
};

export default MilestoneHeader;