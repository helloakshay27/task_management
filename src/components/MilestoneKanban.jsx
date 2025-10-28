import { useCallback, useEffect, useState } from "react"
import { cardsTitle } from "../data/Data"
import Boards from "./Home/Boards"
import MilestoneCard from "./MilestoneCard"
import { useDispatch } from "react-redux"
import { fetchMilestone, updateMilestone } from "../redux/slices/milestoneSlice"
import { useParams } from "react-router-dom"

const MilestoneKanban = () => {
    const dispatch = useDispatch();
    const token = localStorage.getItem("token");
    const { id } = useParams();
    const [milestones, setMilestones] = useState([])

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

    const handleDrop = useCallback(
        (item, newStatus) => {
            if (newStatus.toLowerCase() === "overdue") {
                console.log("Dropping on Overdue board is disabled");
                return;
            }

            handleMilestoneStatusChange({ id: item.id, status: newStatus });
        },
        [handleMilestoneStatusChange]
    );

    return (
        <div className="relative">
            <div
                className="h-[80%] mx-3 my-3 flex items-start gap-1 max-w-full overflow-x-auto overflow-y-auto flex-nowrap"
                style={{ height: "75vh" }}
            >
                {
                    cardsTitle.map(card => {
                        const cardStatus = card.title.toLowerCase().replace(" ", "_");

                        const filteredMilestone = milestones && milestones.filter((milestone) => milestone.status === cardStatus);

                        return (
                            <Boards
                                key={card.id}
                                add={card.add}
                                color={card.color}
                                title={card.title}
                                onDrop={handleDrop}
                            >
                                {
                                    filteredMilestone && filteredMilestone.map((milestone) => (
                                        <div className="relative" key={milestone.id} id={milestone.id}>
                                            <MilestoneCard milestone={milestone} />
                                        </div>
                                    ))
                                }
                            </Boards>
                        )
                    })
                }
            </div>
        </div>
    )
}

export default MilestoneKanban