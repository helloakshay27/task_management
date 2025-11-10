import { useCallback, useEffect, useState } from "react"
import { cardsTitle } from "../data/Data"
import Boards from "./Home/Boards"
import MilestoneCard from "./MilestoneCard"
import MilestoneTaskCard from "./MilestoneTaskCard"
import { useDispatch } from "react-redux"
import { fetchMilestone, updateMilestone } from "../redux/slices/milestoneSlice"
import { useParams } from "react-router-dom"
import { updateTask } from "@/redux/slices/taskSlice"

const MilestoneKanban = () => {
    const dispatch = useDispatch();
    const token = localStorage.getItem("token");
    const { id } = useParams();
    const [milestones, setMilestones] = useState([])
    const [taskCardVisibility, setTaskCardVisibility] = useState({});

    const getMilestones = async () => {
        try {
            const response = await dispatch(fetchMilestone({ token, id })).unwrap();
            setMilestones(response);
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        getMilestones();
    }, [])

    const handleStatusChange = useCallback(
        async ({ id: rowId, payload: newValue }) => {
            const actualProjectId = rowId.replace("M-", "");
            const apiCompatibleValue = newValue.toLowerCase().replace(/\s+/g, "_");

            try {
                await dispatch(
                    updateMilestone({
                        token,
                        id: actualProjectId,
                        payload: { status: apiCompatibleValue },
                    })
                ).unwrap();
                getMilestones();
            } catch (err) {
                console.error(`Failed to update project status for ID ${actualProjectId}:`, err);
            }
        },
        [dispatch]
    );

    const handleMilestoneStatusChange = useCallback(
        ({ id, status }) => {
            setMilestones((prev) =>
                prev.map((mil) => (mil.id === id ? { ...mil, status } : mil))
            );
            handleStatusChange({
                id: `M-${id}`,
                payload: status,
            });
        },
        [handleStatusChange]
    );

    const handleTaskStatusChange = useCallback(async (taskId, newStatus) => {
        try {
            await dispatch(updateTask({
                token,
                id: taskId,
                payload: { status: newStatus.toLowerCase().replace(/\s+/g, "_") }
            })).unwrap();
            getMilestones();
        } catch (err) {
            console.error(`Failed to update task status for ID ${taskId}:`, err);
        }
    }, [dispatch]);

    const handleDrop = useCallback(
        (item, newStatus) => {
            if (newStatus.toLowerCase() === "overdue") {
                console.log("Dropping on Overdue board is disabled");
                return;
            }

            if (item.type === "TASK") {
                handleTaskStatusChange(item.id, newStatus);
            } else {
                handleMilestoneStatusChange({ id: item.id, status: newStatus });
            }
        },
        [handleMilestoneStatusChange, handleTaskStatusChange]
    );

    const toggleTaskCard = useCallback((taskId) => {
        setTaskCardVisibility((prev) => ({
            ...prev,
            [taskId]: !prev[taskId],
        }));
    }, []);

    return (
        <div className="relative">
            <div
                className="h-[80%] mx-3 my-3 flex items-start gap-1 max-w-full overflow-x-auto overflow-y-auto flex-nowrap"
                style={{ height: "75vh" }}
            >
                {
                    cardsTitle.map(card => {
                        const cardStatus = card.title.toLowerCase().replace(" ", "_");

                        // Get milestones for this status board
                        const filteredMilestone = milestones && milestones.filter((milestone) => milestone.status === cardStatus);

                        // Get all tasks that belong in this status board, regardless of parent milestone status
                        const tasksInThisStatus = milestones?.flatMap(milestone =>
                            (milestone.task_managements || [])
                                .filter(task => cardStatus === "active" ?
                                    task.status === "open" :
                                    task.status === cardStatus)
                                .map(task => ({
                                    ...task,
                                    parentMilestone: milestone
                                }))
                        ) || [];

                        return (
                            <Boards
                                key={card.id}
                                add={card.add}
                                color={card.color}
                                title={card.title}
                                count={filteredMilestone.length + tasksInThisStatus.length}
                                onDrop={handleDrop}
                                isDropDisabled={card.title.toLowerCase() === "overdue"}
                            >
                                {/* Show milestones in this status */}
                                {filteredMilestone && filteredMilestone.map((milestone) => {
                                    const milestoneTasks = milestone.task_managements || [];
                                    const visibleTasks = milestoneTasks.filter(task =>
                                        cardStatus === "active" ? task.status === "open" : task.status === cardStatus
                                    );

                                    return (
                                        <div key={milestone.id} className="relative">
                                            <div id={`milestone-${milestone.id}`}>
                                                <MilestoneCard
                                                    milestone={milestone}
                                                    toggleTaskCard={() => toggleTaskCard(milestone.id)}
                                                    hasVisibleTasks={visibleTasks.length > 0}
                                                    isExpanded={taskCardVisibility[milestone.id]}
                                                />
                                            </div>

                                            {taskCardVisibility[milestone.id] && visibleTasks.length > 0 && (
                                                <div className="ml-5 mt-2 space-y-2">
                                                    {visibleTasks.map((task) => (
                                                        <div
                                                            key={`task-${task.id}`}
                                                            id={`task-${task.id}`}
                                                            className="relative"
                                                        >
                                                            <MilestoneTaskCard
                                                                task={task}
                                                                parentMilestoneId={milestone.id}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Show tasks from other milestones that belong in this status */}
                                {tasksInThisStatus
                                    .filter(task => !filteredMilestone.find(m => m.id === task.parentMilestone.id))
                                    .map((task) => (
                                        <div
                                            key={`task-${task.id}`}
                                            id={`task-${task.id}`}
                                            className="relative mt-2"
                                        >
                                            <MilestoneTaskCard
                                                task={task}
                                                parentMilestoneId={task.parentMilestone.id}
                                            />
                                        </div>
                                    ))}

                                {/* Show placeholder when no items */}
                                {filteredMilestone.length === 0 && tasksInThisStatus.length === 0 && (
                                    <img src="/draganddrop.svg" alt="svg" className="w-full" />
                                )}
                            </Boards>
                        )
                    })
                }
            </div>
        </div>
    )
}

export default MilestoneKanban