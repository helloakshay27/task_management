import { useGSAP } from "@gsap/react";
import {
    ChevronDown,
    ChevronDownCircle,
    PencilIcon,
    Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import gsap from "gsap";
import { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { fetchStatus } from "../../redux/slices/statusSlice";
import { deleteMilestone, fetchMilestoneById, updateMilestone } from "../../redux/slices/milestoneSlice";
import MilestoneDependancyTable from "../../components/MilestoneDependancyTable";
import EditMilestoneModal from "../../components/EditMilestoneModal";
import { DeleteConfirmationModal } from "../../components/DeleteConfirmationModal";

const mapStatusToDisplay = (rawStatus) => {
    const statusMap = {
        open: "Open",
        in_progress: "In Progress",
        on_hold: "On Hold",
        overdue: "Overdue",
        completed: "Completed",
    };
    return statusMap[rawStatus?.toLowerCase()] || "Active";
};

const mapDisplayToApiStatus = (displayStatus) => {
    const reverseStatusMap = {
        Open: "open",
        "In Progress": "in_progress",
        "On Hold": "on_hold",
        Overdue: "overdue",
        Completed: "completed",
    };
    return reverseStatusMap[displayStatus] || "open";
};

const calculateDuration = (end) => {
    const now = new Date();
    const endDate = new Date(end);

    endDate.setHours(23, 59, 59, 999);

    const diffMs = endDate - now;
    if (diffMs <= 0) return "0s";

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const remainingHours = hours % 24;
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;

    return `${days > 0 ? days + "d " : ""}${remainingHours > 0 ? remainingHours + "h " : ""
        }${remainingMinutes > 0 ? remainingMinutes + "m " : ""}${remainingSeconds}s`;
};

const CountdownTimer = ({ targetDate }) => {
    const [countdown, setCountdown] = useState(calculateDuration(targetDate));

    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown(calculateDuration(targetDate));
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    return (
        <div className="text-left text-[#029464] text-[12px]">{countdown}</div>
    );
};

function formatToDDMMYYYY_AMPM(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    hours = String(hours).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
}

const MilestoneDetailsPage = () => {
    const token = localStorage.getItem("token");
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { mid } = useParams();
    const { taskDetails: task } = useSelector((state) => state.taskDetails);

    const [milestone, setMilestone] = useState({})
    const [isFirstCollapsed, setIsFirstCollapsed] = useState(false);
    const [isSecondCollapsed, setIsSecondCollapsed] = useState(false);
    const [tab, setTab] = useState("Dependancy");
    const [openDropdown, setOpenDropdown] = useState(false);
    const [selectedOption, setSelectedOption] = useState("Open");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const firstContentRef = useRef(null);
    const secondContentRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const getMilestone = async () => {
            try {
                const resonse = await dispatch(fetchMilestoneById({ token, id: mid })).unwrap();
                setMilestone(resonse)
                setSelectedOption(mapStatusToDisplay(resonse.status))
            } catch (error) {
                console.log(error)
            }
        }

        getMilestone()
    }, [])

    useEffect(() => {
        if (task?.status) setSelectedOption(mapStatusToDisplay(task.status));
    }, [task]);

    useEffect(() => {
        dispatch(fetchStatus({ token }));
    }, [dispatch]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleDeleteMilestone = async () => {
        try {
            await dispatch(deleteMilestone({ token, id: milestone.id })).unwrap();
            setIsDeleteModalOpen(false);
            navigate(-1);
        } catch (err) {
            console.log(err);
            setIsDeleteModalOpen(false);
        }
    };

    const dropdownOptions = [
        "Open",
        "In Progress",
        "On Hold",
        "Overdue",
        "Completed",
    ];

    const handleOptionSelect = (option) => {
        setSelectedOption(option);
        setOpenDropdown(false);
        dispatch(
            updateMilestone({
                token,
                id: mid,
                payload: { status: mapDisplayToApiStatus(option) },
            })
        );
    };

    useGSAP(() => {
        gsap.set(firstContentRef.current, { height: "auto" });
        gsap.set(secondContentRef.current, { height: "auto" });
    }, []);

    const toggleFirstCollapse = () => {
        if (isFirstCollapsed) {
            gsap.to(firstContentRef.current, {
                height: "auto",
                opacity: 1,
                duration: 0.5,
                ease: "power2.inOut",
            });
        } else {
            gsap.to(firstContentRef.current, {
                height: 0,
                opacity: 0,
                duration: 0.5,
                ease: "power2.inOut",
            });
        }
        setIsFirstCollapsed(!isFirstCollapsed);
    };

    const toggleSecondCollapse = () => {
        if (isSecondCollapsed) {
            gsap.to(secondContentRef.current, {
                height: "auto",
                opacity: 1,
                duration: 0.5,
                ease: "power2.inOut",
            });
        } else {
            gsap.to(secondContentRef.current, {
                height: 0,
                opacity: 0,
                duration: 0.5,
                ease: "power2.inOut",
            });
        }
        setIsSecondCollapsed(!isSecondCollapsed);
    };

    return (
        <>
            <div className="m-4">
                <Toaster position="top-center" />
                <div className="px-4 pt-1">
                    <h2 className="text-[15px] p-3 px-0">
                        <span className="mr-3">T-0{milestone.id}</span>
                        <span>{milestone.title}</span>
                    </h2>
                    <div className="border-b-[3px] border-[rgba(190, 190, 190, 1)]"></div>
                    <div className="flex items-center justify-between my-3 text-[12px]">
                        <div className="flex items-center gap-3 text-[#323232]">
                            <span>Created By: {task.created_by?.name}</span>
                            <span className="h-6 w-[1px] border border-gray-300"></span>
                            <span className="flex items-center gap-3">
                                Created On: {formatToDDMMYYYY_AMPM(milestone.created_at)}
                            </span>
                            <span className="h-6 w-[1px] border border-gray-300"></span>
                            <span className="flex relative items-center gap-2 cursor-pointer px-2 py-1 w-[150px] rounded-md text-sm text-[#c72030]">
                                <div className="relative w-full" ref={dropdownRef}>
                                    <div
                                        className="flex items-center justify-between gap-1 cursor-pointer px-2 py-1"
                                        onClick={() => setOpenDropdown(!openDropdown)}
                                        role="button"
                                        aria-haspopup="true"
                                        aria-expanded={openDropdown}
                                        tabIndex={0}
                                        onKeyDown={(e) =>
                                            e.key === "Enter" && setOpenDropdown(!openDropdown)
                                        }
                                    >
                                        <span className="text-[13px]">{selectedOption}</span>
                                        <ChevronDown
                                            size={15}
                                            className={`${(milestone.task_managements?.length === 0 && openDropdown) ? "rotate-180" : ""
                                                } transition-transform`}
                                        />
                                    </div>
                                    {
                                        milestone.task_managements?.length === 0 && (
                                            <ul
                                                className={`dropdown-menu absolute right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden ${openDropdown ? "block" : "hidden"
                                                    }`}
                                                role="menu"
                                                style={{
                                                    minWidth: "150px",
                                                    maxHeight: "400px",
                                                    overflowY: "auto",
                                                    zIndex: 1000,
                                                }}
                                            >
                                                {dropdownOptions.map((option, idx) => (
                                                    <li key={idx} role="menuitem">
                                                        <button
                                                            className={`dropdown-item w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-100 ${selectedOption === option
                                                                ? "bg-gray-100 font-semibold"
                                                                : ""
                                                                }`}
                                                            onClick={() => handleOptionSelect(option)}
                                                        >
                                                            {option}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )
                                    }
                                </div>
                            </span>
                            <span className="h-6 w-[1px] border border-gray-300"></span>
                            <span
                                className="cursor-pointer flex items-center gap-1"
                                onClick={() => setIsEditModalOpen(true)}
                            >
                                <PencilIcon className="mx-1" size={15} /> Edit Milestone
                            </span>
                            <span className="h-6 w-[1px] border border-gray-300"></span>
                            <span
                                className="cursor-pointer flex items-center gap-1"
                                onClick={() => setIsDeleteModalOpen(true)}
                            >
                                <Trash2 className="mx-1" size={15} /> Delete Milestone
                            </span>
                        </div>
                    </div>
                    <div className="border-b-[3px] border-grey my-3"></div>
                    <div className="border rounded-md shadow-custom p-5 mb-4">
                        <div
                            className="font-[600] text-[16px] flex items-center gap-4"
                            onClick={toggleSecondCollapse}
                        >
                            <ChevronDownCircle
                                color="#E95420"
                                size={30}
                                className={`${isSecondCollapsed ? "rotate-180" : "rotate-0"
                                    } transition-transform`}
                            />{" "}
                            Details
                        </div>
                        <div className="mt-3" ref={secondContentRef}>
                            <div className="flex flex-col">
                                <div className="w-1/2 flex items-center justify-start gap-3 ml-36">
                                    <div className="text-right text-[12px] font-[500]">
                                        Responsible Person:
                                    </div>
                                    <div className="text-left text-[12px]">
                                        {milestone.owner_name}
                                    </div>
                                </div>

                                <span className="border h-[1px] inline-block w-full my-4"></span>

                                <div className="w-1/2 flex items-center justify-start gap-3 ml-36">
                                    <div className="text-right text-[12px] font-[500]">
                                        Duration:
                                    </div>
                                    <CountdownTimer targetDate={milestone.end_date} />
                                </div>

                                <span className="border h-[1px] inline-block w-full my-4"></span>

                                <div className="w-1/2 flex items-center justify-start gap-3 ml-36">
                                    <div className="text-right text-[12px] font-[500]">
                                        Start Date:
                                    </div>
                                    <div className="text-left text-[12px]">
                                        {milestone?.start_date?.split("T")[0]}
                                    </div>
                                </div>

                                <span className="border h-[1px] inline-block w-full my-4"></span>

                                <div className="w-1/2 flex items-center justify-start gap-3 ml-36">
                                    <div className="text-right text-[12px] font-[500]">
                                        End Date:
                                    </div>
                                    <div className="text-left text-[12px]">
                                        {milestone?.end_date?.split("T")[0]}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between my-3">
                            <div className="flex items-center gap-10">
                                {[
                                    "Dependancy",
                                ].map((tabName, index) => (
                                    <div
                                        key={index}
                                        id={index + 1}
                                        className={`text-[14px] font-[400] ${tab === tabName ? "selected" : "cursor-pointer"
                                            }`}
                                        onClick={() => setTab(tabName)}
                                    >
                                        {tabName}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="border-b-[3px] border-[rgba(190, 190, 190, 1)]"></div>
                        <div>
                            {tab === "Dependancy" && <MilestoneDependancyTable />}
                        </div>
                    </div>
                </div>
            </div>
            {isEditModalOpen && (
                <EditMilestoneModal
                    isModalOpen={isEditModalOpen}
                    setIsModalOpen={setIsEditModalOpen}
                    milestoneId={milestone.id}
                    projectId={milestone.project_management_id}
                />
            )}
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteMilestone}
            />
        </>
    );
};

export default MilestoneDetailsPage;