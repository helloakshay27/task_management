import { useEffect } from "react";
import TaskActions from "../components/Home/TaskActions";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProjectDetails } from "../redux/slices/projectSlice";

const MilestoneHeader = ({ selectedType, setSelectedType }) => {
    const token = localStorage.getItem("token");
    const { id } = useParams();
    const dispatch = useDispatch();

    const { fetchProjectDetails: project } = useSelector(state => state.fetchProjectDetails)

    useEffect(() => {
        dispatch(fetchProjectDetails({ token, id }))
    }, [dispatch])

    return (
        <div>
            <h3 className="text-[11px] text-gray-400 mx-6 my-4">{project.title} / Milestones</h3>
            <hr className="border border-gray-200" />

            <TaskActions selectedType={selectedType} setSelectedType={setSelectedType} addType={"Milestone"} />
        </div>
    );
};

export default MilestoneHeader;