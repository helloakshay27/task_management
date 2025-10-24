import React, { useEffect, useRef } from "react";
import axios from "axios";
import "dhtmlx-gantt";
import "dhtmlx-gantt/codebase/dhtmlxgantt.css";
import { useParams, useNavigate } from "react-router-dom";
import { baseURL } from "./../../apiDomain";
import toast from "react-hot-toast";

// Add custom styles to ensure visibility
const ganttStyles = `
    .gantt_task_line {
        background-color: #3498db !important;
        border: 1px solid #2980b9 !important;
    }
    
    .milestone-task .gantt_task_line {
        background-color: #e74c3c !important;
        border: 1px solid #c0392b !important;
    }
    
    .sub-task .gantt_task_line {
        background-color: #f39c12 !important;
        border: 1px solid #e67e22 !important;
    }
    
    .gantt_task_content {
        color: white !important;
        font-weight: bold !important;
    }
    
    .gantt_grid_data .gantt_cell {
        border-right: 1px solid #e0e0e0 !important;
    }
    
    .gantt_grid_scale .gantt_grid_head_cell {
        background-color: #f8f9fa !important;
        border-right: 1px solid #e0e0e0 !important;
    }
`;

// Add styles to document head
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = ganttStyles;
    document.head.appendChild(styleSheet);
}

const GanttChart = () => {
    const { id } = useParams();
    const ganttContainer = useRef(null);
    const [scale, setScale] = React.useState("week");
    const navigate = useNavigate();

    // Helper function to calculate milestone progress
    const calculateMilestoneProgress = (milestoneId, tasksData) => {
        // Get all tasks (including subtasks) that belong to this milestone
        const milestoneTasks = tasksData.filter(task =>
            task.parent === milestoneId && task.type === "task"
        );

        if (milestoneTasks.length === 0) {
            return { total: 0, completed: 0, percentage: 0 };
        }

        let totalTasks = 0;
        let completedTasks = 0;

        // Count tasks and their subtasks
        milestoneTasks.forEach(task => {
            // Get all subtasks for this task
            const subTasks = tasksData.filter(st =>
                st.parent === task.id && st.type === "sub_task"
            );

            if (subTasks.length > 0) {
                // If task has subtasks, count subtasks
                totalTasks += subTasks.length;
                completedTasks += subTasks.filter(st =>
                    st.status && st.status.toLowerCase() === "completed"
                ).length;
            } else {
                // If no subtasks, count the task itself
                totalTasks += 1;
                if (task.status && task.status.toLowerCase() === "completed") {
                    completedTasks += 1;
                }
            }
        });

        const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return {
            total: totalTasks,
            completed: completedTasks,
            percentage: Math.round(percentage * 100) / 100 // Round to 2 decimal places
        };
    };

    useEffect(() => {
        const handleGanttButtonClick = (e) => {
            const btn = e.target.closest(".gantt-open-task");
            if (btn) {
                const id = btn.getAttribute("data-id");
                if (id) {
                    console.log(id)
                    navigate(`${id}/tasks`);
                }
            }
        };

        const container = ganttContainer.current;
        container?.addEventListener("click", handleGanttButtonClick);

        return () => {
            container?.removeEventListener("click", handleGanttButtonClick);
        };
    }, [navigate]);

    useEffect(() => {
        const handleMiletstoneViewClick = (e) => {
            const btn = e.target.closest(".gantt-milestone-link");
            if (btn) {
                const id = btn.getAttribute("data-id");
                if (id) {
                    navigate(`${id}`);
                }
            }
        };

        const container = ganttContainer.current;
        container?.addEventListener("click", handleMiletstoneViewClick);

        return () => {
            container?.removeEventListener("click", handleMiletstoneViewClick);
        };
    }, [navigate]);

    useEffect(() => {
        console.log("Gantt useEffect started, scale:", scale);

        // Columns
        gantt.config.columns = [
            {
                name: "text",
                label: "Milestone / Task Title",
                tree: true,
                width: 250,
                resize: true,
                template: function (task) {
                    if (task.type === "milestone") {
                        return `<span class="gantt-milestone-link" data-id="${task.navigationid}" style="cursor: pointer;">${task.text}</span>`;
                    }
                    return task.text;
                },
            },
            {
                name: "progress",
                label: "Progress",
                align: "center",
                width: 100,
                template: function (task) {
                    if (task.type === "milestone") {
                        return `${Math.round(task.progress * 100)}%`;
                    }
                    return "";
                },
            },
            {
                name: "status",
                label: "Status",
                align: "center",
                width: 100,
                template: function (task) {
                    const status = task.status || "Open";
                    return status.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
                },
            },
            {
                name: "actions",
                label: "Actions",
                align: "center",
                width: 130,
                resize: true,
                template: function (task) {
                    if (task.type !== "milestone") {
                        return "";
                    }

                    return `
                        <span class="flex items-center justify-center gap-3 mt-2 text-gray-500">
                            <button 
                            class="gantt-open-task" 
                            data-id="${task.navigationid}" 
                            title="View Tasks"
                            style="background: none; border: none; cursor: pointer;"
                            >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 14.875H11.5417C12.4257 14.875 13.2736 14.5238 13.8987 13.8987C14.5238 13.2736 14.875 12.4257 14.875 11.5417V9.45833M8 14.875H4.45833C3.57428 14.875 2.72643 14.5238 2.10131 13.8987C1.47619 13.2736 1.125 12.4257 1.125 11.5417V8M8 14.875V10.5C8 9.83696 7.73661 9.20107 7.26777 8.73223C6.79893 8.26339 6.16304 8 5.5 8H1.125M1.125 8V4.45833C1.125 3.57428 1.47619 2.72643 2.10131 2.10131C2.72643 1.47619 3.57428 1.125 4.45833 1.125H6.54167M9.45833 1.125H14.0417C14.2717 1.125 14.48 1.21833 14.6308 1.36917M14.6308 1.36917C14.7871 1.52541 14.875 1.73734 14.875 1.95833V6.54167M14.6308 1.36917L14.0417 1.95833L9.45833 6.54167" stroke="black" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            </button>
                        </span>
                    `;
                },
            },
        ];

        const weekDateFormatter = gantt.date.date_to_str("%d %M");

        if (scale === "week") {
            gantt.config.scales = [
                {
                    unit: "week",
                    step: 1,
                    format: function (date) {
                        const start = gantt.date.week_start(new Date(date));
                        const end = gantt.date.add(start, 7, "day");
                        return `${weekDateFormatter(start)} - ${weekDateFormatter(
                            end
                        )} , ${start.getFullYear()}`;
                    },
                },
                {
                    unit: "day",
                    step: 1,
                    format: function (date) {
                        return gantt.date.date_to_str("%j")(date);
                    },
                },
            ];
        } else if (scale === "month") {
            gantt.config.scales = [
                {
                    unit: "month",
                    step: 1,
                    format: "%F, %Y",
                },
                {
                    unit: "week",
                    step: 1,
                    format: function (date) {
                        const start = gantt.date.week_start(new Date(date));
                        const end = gantt.date.add(start, 7, "day");
                        return `${weekDateFormatter(start)} - ${weekDateFormatter(end)}`;
                    },
                },
            ];
        } else if (scale === "year") {
            gantt.config.scales = [
                {
                    unit: "year",
                    step: 1,
                    format: "%Y",
                },
                {
                    unit: "month",
                    step: 1,
                    format: "%M",
                },
            ];
        }

        gantt.config.row_height = 40;
        gantt.config.scale_height = 60;
        gantt.config.grid_width = 500;
        gantt.config.show_task_cells = true;
        gantt.config.show_progress = true;
        gantt.config.grid_resize = true;
        gantt.config.autofit_columns = true;

        gantt.config.date_format = "%d-%m-%Y";
        gantt.config.xml_date = "%d-%m-%Y";

        gantt.config.auto_scheduling = true;
        gantt.config.auto_scheduling_strict = true;

        gantt.attachEvent("onBeforeTaskDelete", function (id, task) {
            let entityType = '';
            let entityId = '';

            if (id.startsWith('milestone-')) {
                entityType = 'milestone';
                entityId = id.replace('milestone-', '');
            } else if (id.startsWith('task-')) {
                entityType = 'task';
                entityId = id.split('-')[1];
            } else if (id.startsWith('subtask-')) {
                entityType = 'subtask';
                entityId = id.replace('subtask-', '');
            }

            const apiEndpoint = entityType === 'milestone'
                ? `${baseURL}/milestones/${entityId}.json`
                : entityType === 'task'
                    ? `${baseURL}/task_managements/${entityId}.json`
                    : `${baseURL}/task_managements/${entityId}.json`;

            axios.delete(apiEndpoint, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            })
                .then(response => {
                    console.log(`${entityType} deleted successfully:`, response.data);
                    toast.success(`${entityType.charAt(0).toUpperCase() + entityType.slice(1)} deleted successfully!`);
                })
                .catch(error => {
                    console.error(`Error deleting ${entityType}:`, error);
                    toast.error(`Failed to delete ${entityType}. Please try again.`);
                    gantt.undo();
                });

            return true;
        });

        gantt.templates.task_class = function (start, end, task) {
            if (task.type === "milestone") {
                return "milestone-task";
            } else if (task.type === "sub_task") {
                return "sub-task";
            }
            return "custom-task";
        };

        gantt.config.types.milestone = "milestone";
        gantt.config.types.task = "task";
        gantt.config.types.sub_task = "sub_task";

        if (ganttContainer.current) {
            gantt.init(ganttContainer.current);
        } else {
            console.error("Gantt container not found!");
            return;
        }

        const fetchMilestones = async () => {
            try {
                const response = await axios.get(
                    `${baseURL}/milestones.json?q[project_management_id_eq]=${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                );

                const rawData = response.data;

                console.log("Fetched milestones:", rawData);
                const tasksData = [];
                const linksData = [];

                const taskIds = new Set();

                function formatDateDMYFromISO(dateStr) {
                    if (!dateStr) return "";
                    const date = new Date(dateStr);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`;
                }

                function calculateDuration(startStr, endStr) {
                    if (!startStr || !endStr) return 1;
                    const startParts = startStr.split("-");
                    const endParts = endStr.split("-");
                    const start = new Date(
                        `${startParts[2]}-${startParts[1]}-${startParts[0]}`
                    );
                    const end = new Date(`${endParts[2]}-${endParts[1]}-${endParts[0]}`);
                    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
                    const diffTime = end.getTime() - start.getTime();
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    return diffDays > 0 ? diffDays : 1;
                }

                rawData.forEach((item) => {
                    const milestoneId = `milestone-${item.id}`;
                    const formattedStart = item.start_date
                        ? formatDateDMYFromISO(item.start_date)
                        : formatDateDMYFromISO(new Date().toISOString());
                    const formattedEnd = item.end_date
                        ? formatDateDMYFromISO(item.end_date)
                        : formatDateDMYFromISO(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

                    // Placeholder for milestone - will be updated after all tasks are added
                    tasksData.push({
                        navigationid: item.id,
                        id: milestoneId,
                        text: item.title || "Untitled Milestone",
                        start_date: formattedStart,
                        end_date: formattedEnd,
                        duration: formattedStart && formattedEnd
                            ? calculateDuration(formattedStart, formattedEnd)
                            : 1,
                        progress: 0.0,
                        totalTasks: 0,
                        completedTasks: 0,
                        status: "Open",
                        depends: item.depends_on_id
                            ? `milestone-${item.depends_on_id}`
                            : null,
                        type: "milestone",
                        owner: item.owner_id,
                        parent: 0,
                        open: true,
                    });

                    if (item.depends_on_id) {
                        linksData.push({
                            id: `link-milestone-${item.id}`,
                            source: `milestone-${item.depends_on_id}`,
                            target: milestoneId,
                            type: "0",
                        });
                    }

                    if (Array.isArray(item.task_managements)) {
                        item.task_managements.forEach((task) => {
                            const taskId = `task-${task.id}`;
                            let uniqueTaskId = taskId;

                            if (taskIds.has(taskId)) {
                                uniqueTaskId = `task-${task.id}-milestone-${item.id}`;
                            }
                            taskIds.add(uniqueTaskId);

                            const formattedStartTask = task.started_at
                                ? formatDateDMYFromISO(task.started_at)
                                : formattedStart;

                            const formattedEndTask = task.target_date
                                ? formatDateDMYFromISO(task.target_date)
                                : formattedEnd;

                            const taskDuration = formattedStartTask && formattedEndTask
                                ? calculateDuration(formattedStartTask, formattedEndTask)
                                : task.estimated_hour
                                    ? task.estimated_hour + (task.estimated_min ? task.estimated_min / 60 : 0)
                                    : 1;

                            tasksData.push({
                                id: uniqueTaskId,
                                text: task.title || "Untitled Task",
                                start_date: formattedStartTask,
                                end_date: formattedEndTask,
                                duration: taskDuration,
                                progress: 0.0,
                                status: task.status || "Open",
                                owner: task.responsible_person
                                    ? task.responsible_person.name
                                    : "",
                                parent: milestoneId,
                                type: "task",
                            });

                            if (Array.isArray(task.sub_tasks_managements)) {
                                task.sub_tasks_managements.forEach((subTask) => {
                                    const subTaskId = `subtask-${subTask.id}`;
                                    const formattedStartSubTask = subTask.started_at
                                        ? formatDateDMYFromISO(subTask.started_at)
                                        : formattedStartTask;

                                    const formattedEndSubTask = subTask.target_date
                                        ? formatDateDMYFromISO(subTask.target_date)
                                        : formattedEndTask;

                                    const subTaskDuration = formattedStartSubTask && formattedEndSubTask
                                        ? calculateDuration(formattedStartSubTask, formattedEndSubTask)
                                        : subTask.estimated_hour
                                            ? subTask.estimated_hour + (subTask.estimated_min ? subTask.estimated_min / 60 : 0)
                                            : 1;

                                    tasksData.push({
                                        id: subTaskId,
                                        text: subTask.title || "Untitled Sub-task",
                                        start_date: formattedStartSubTask,
                                        end_date: formattedEndSubTask,
                                        duration: subTaskDuration,
                                        progress: 0.0,
                                        status: subTask.status || "Open",
                                        owner: subTask.responsible_person
                                            ? subTask.responsible_person.name
                                            : "",
                                        parent: uniqueTaskId,
                                        type: "sub_task",
                                    });
                                });
                            }
                        });
                    }
                });

                // Calculate progress for all milestones after all tasks are added
                tasksData.forEach(task => {
                    if (task.type === "milestone") {
                        const progressData = calculateMilestoneProgress(task.id, tasksData);
                        task.progress = progressData.percentage / 100;
                        task.totalTasks = progressData.total;
                        task.completedTasks = progressData.completed;

                        console.log(`Milestone ${task.text}: ${progressData.completed}/${progressData.total} = ${progressData.percentage}%`);
                    }
                });

                console.log("Parsed tasks data:", tasksData);
                console.log("Links data:", linksData);

                gantt.clearAll();

                const validTasks = tasksData.filter(task => {
                    if (!task.id || !task.text) {
                        console.warn("Invalid task found:", task);
                        return false;
                    }
                    return true;
                });

                console.log("Valid tasks to render:", validTasks.length);

                try {
                    gantt.parse({
                        data: validTasks,
                        links: linksData,
                    });

                    gantt.render();

                    setTimeout(() => {
                        gantt.render();
                    }, 100);

                    console.log("Gantt chart rendered successfully");
                } catch (error) {
                    console.error("Error parsing gantt data:", error);
                    console.log("Failed data:", { data: validTasks, links: linksData });
                }
            } catch (error) {
                console.error("Error loading milestones:", error);
            }
        };

        fetchMilestones();

        // Debounce mechanism to prevent multiple API calls
        let updateTimeout = null;
        let isUpdating = false; // Flag to prevent concurrent updates

        // Format date from Gantt (Date object) to YYYY-MM-DD
        function formatDateToISO(date) {
            if (!date) return null;
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        // Separate function to handle the actual update
        function handleTaskUpdate(taskId, task) {
            if (isUpdating) {
                console.log("Update already in progress, skipping...");
                return;
            }

            let entityType = '';
            let entityId = '';

            if (taskId.startsWith('milestone-')) {
                entityType = 'milestone';
                entityId = taskId.replace('milestone-', '');
            } else if (taskId.startsWith('task-')) {
                entityType = 'task';
                entityId = taskId.split('-')[1];
            } else if (taskId.startsWith('subtask-')) {
                entityType = 'subtask';
                entityId = taskId.replace('subtask-', '');
            }

            // Update Milestone via API
            if (entityType === 'milestone') {
                isUpdating = true;

                const payload = {
                    milestone: {
                        title: task.text,
                        start_date: formatDateToISO(task.start_date),
                        end_date: formatDateToISO(task.end_date),
                        duration: task.duration,
                        project_management_id: parseInt(id), // Use project ID from URL params
                    }
                };

                // Add owner_id if exists
                if (task.owner) {
                    payload.milestone.owner_id = task.owner;
                }

                // Add depends_on_id if exists
                if (task.depends && task.depends.startsWith('milestone-')) {
                    payload.milestone.depends_on_id = parseInt(task.depends.replace('milestone-', ''));
                }

                console.log('Sending milestone update:', payload);

                axios.put(
                    `${baseURL}/milestones/${entityId}.json`,
                    payload,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                )
                    .then(response => {
                        console.log('Milestone updated successfully:', response.data);
                        toast.success('Milestone updated successfully!');
                    })
                    .catch(error => {
                        console.error('Error updating milestone:', error);
                        console.error('Error response:', error.response?.data);
                        toast.error('Failed to update milestone. Please try again.');
                        // Refresh the data instead of undo
                        setTimeout(() => {
                            fetchMilestones();
                        }, 1000);
                    })
                    .finally(() => {
                        isUpdating = false;
                    });
            }
            // Update Task via API
            else if (entityType === 'task') {
                isUpdating = true;

                const payload = {
                    task_management: {
                        title: task.text,
                        started_at: formatDateToISO(task.start_date),
                        target_date: formatDateToISO(task.end_date),
                        status: task.status || 'open',
                    }
                };

                axios.put(
                    `${baseURL}/task_managements/${entityId}.json`,
                    payload,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                )
                    .then(response => {
                        console.log('Task updated successfully:', response.data);
                        toast.success('Task updated successfully!');
                    })
                    .catch(error => {
                        console.error('Error updating task:', error);
                        toast.error('Failed to update task. Please try again.');
                        setTimeout(() => {
                            fetchMilestones();
                        }, 1000);
                    })
                    .finally(() => {
                        isUpdating = false;
                    });
            }
            // Update Subtask via API
            else if (entityType === 'subtask') {
                isUpdating = true;

                const payload = {
                    task_management: {
                        title: task.text,
                        started_at: formatDateToISO(task.start_date),
                        target_date: formatDateToISO(task.end_date),
                        status: task.status || 'open',
                    }
                };

                axios.put(
                    `${baseURL}/task_managements/${entityId}.json`,
                    payload,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                )
                    .then(response => {
                        console.log('Subtask updated successfully:', response.data);
                        toast.success('Subtask updated successfully!');
                    })
                    .catch(error => {
                        console.error('Error updating subtask:', error);
                        toast.error('Failed to update subtask. Please try again.');
                        setTimeout(() => {
                            fetchMilestones();
                        }, 1000);
                    })
                    .finally(() => {
                        isUpdating = false;
                    });
            }
        }

        // Attach event handler ONCE
        const taskUpdateHandler = gantt.attachEvent("onAfterTaskUpdate", function (taskId, task) {
            console.log("Task update event triggered for:", taskId);

            // Clear existing timeout
            if (updateTimeout) {
                clearTimeout(updateTimeout);
            }

            // Debounce: wait 1 second before making API call (increased from 500ms)
            updateTimeout = setTimeout(() => {
                console.log("Processing update for task:", taskId);
                handleTaskUpdate(taskId, task);
            }, 1000);
        });

        gantt.attachEvent("onAfterLinkAdd", function (id, link) {
            console.log("Link added:", link);

            // Handle dependency creation
            const sourceId = link.source;
            const targetId = link.target;

            // If linking milestones, update the target milestone's depends_on_id
            if (targetId.startsWith('milestone-')) {
                const milestoneId = targetId.replace('milestone-', '');
                const dependsOnId = sourceId.startsWith('milestone-') 
                    ? parseInt(sourceId.replace('milestone-', '')) 
                    : null;

                if (dependsOnId) {
                    const payload = {
                        milestone: {
                            depends_on_id: dependsOnId
                        }
                    };

                    axios.put(
                        `${baseURL}/milestones/${milestoneId}.json`,
                        payload,
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${localStorage.getItem("token")}`,
                            },
                        }
                    )
                        .then(response => {
                            console.log('Dependency updated successfully:', response.data);
                            toast.success('Dependency added successfully!');
                        })
                        .catch(error => {
                            console.error('Error updating dependency:', error);
                            toast.error('Failed to add dependency. Please try again.');
                            gantt.deleteLink(id);
                        });
                }
            }
        });


        //     console.log("Link deleted:", link);

        //     // Handle dependency removal
        //     const targetId = link.target;

        //     // If unlinking milestones, remove the depends_on_id
        //     if (targetId.startsWith('milestone-')) {
        //         const milestoneId = targetId.replace('milestone-', '');

        //         const payload = {
        //             milestone: {
        //                 depends_on_id: null
        //             }
        //         };

        //         axios.put(
        //             `${baseURL}/milestones/${milestoneId}.json`,
        //             payload,
        //             {
        //                 headers: {
        //                     'Content-Type': 'application/json',
        //                     Authorization: `Bearer ${localStorage.getItem("token")}`,
        //                 },
        //             }
        //         )
        //             .then(response => {
        //                 console.log('Dependency removed successfully:', response.data);
        //                 toast.success('Dependency removed successfully!');
        //             })
        //             .catch(error => {
        //                 console.error('Error removing dependency:', error);
        //                 toast.error('Failed to remove dependency.');
        //             });
        //     }
        // });

        return () => {
            console.log("Cleaning up gantt");
            
            // Detach event handlers
            if (taskUpdateHandler) {
             // gantt.attachEvent("onAfterLinkDelete", function (id, link) {           gantt.detachEvent(taskUpdateHandler);
            }
            
            // Clear timeout
            if (updateTimeout) {
                clearTimeout(updateTimeout);
            }
            
            // Clear gantt
            if (gantt && gantt.clearAll) {
                gantt.clearAll();
            }
        };
    }, [scale, id]);

    return (
        <div style={{ overflowX: "auto", width: "100%" }}>
            <div className="flex justify-end mb-2 me-4">
                <select
                    value={scale}
                    onChange={(e) => setScale(e.target.value)}
                    className="border rounded p-1"
                >
                    <option value="week">Week View</option>
                    <option value="month">Month View</option>
                    <option value="year">Year View</option>
                </select>
            </div>
            <div
                ref={ganttContainer}
                style={{
                    minWidth: "1200px",
                    height: "600px",
                    position: "relative",
                    overflow: "hidden"
                }}
            />
        </div>
    );
};

export default GanttChart;