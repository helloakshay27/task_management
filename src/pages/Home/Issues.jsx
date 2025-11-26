import React, { useState } from 'react'
import IssuesTable from '../../components/Home/Issues/Table'
import TaskActions from '../../components/Home/TaskActions'

// Define available columns for Issues table - must match allColumns in Issues/Table.jsx
const ISSUES_TABLE_COLUMNS = [
    { id: "id", label: "Issue ID", key: "id" },
    { id: "projectName", label: "Project Name", key: "projectName" },
    { id: "milestoneName", label: "Milestone Name", key: "milestoneName" },
    { id: "taskName", label: "Task Name", key: "taskName" },
    { id: "subtaskName", label: "Subtask Name", key: "subtaskName" },
    { id: "issueTitle", label: "Issues Title", key: "issueTitle" },
    { id: "attachments", label: "Attachments", key: "attachments" },
    { id: "status", label: "Status", key: "status" },
    { id: "responsiblePerson", label: "Responsible Person", key: "responsiblePerson" },
    { id: "issueType", label: "Type", key: "issueType" },
    { id: "startDate", label: "Start Date", key: "startDate" },
    { id: "endDate", label: "End Date", key: "endDate" },
    { id: "priority", label: "Priority", key: "priority" },
    { id: "comments", label: "Comments", key: "comments" },
];

const Issues = ({ setIsSidebarOpen }) => {
    const [selectedType, setSelectedType] = useState("List")
    const [selectedColumns, setSelectedColumns] = useState({})

    const handleColumnsChange = (columns) => {
        setSelectedColumns(columns);
    };

    return (
        <>
            <TaskActions
                setIsSidebarOpen={setIsSidebarOpen}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                addType={"Issues"}
                context="Issues"
                onColumnsChange={handleColumnsChange}
                availableColumns={ISSUES_TABLE_COLUMNS}
            />
            <IssuesTable selectedColumns={selectedColumns} />
        </>
    )
}

export default Issues