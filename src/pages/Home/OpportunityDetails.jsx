import gsap from "gsap";
import { ChevronDown, ChevronDownCircle, CircleCheckBig, Trash2 } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { baseURL } from "../../../apiDomain";
import toast from "react-hot-toast";
import { Mention, MentionsInput } from "react-mentions";
import { fetchUsers } from "@/redux/slices/userSlice";
import { fetchActiveTags } from "@/redux/slices/tagsSlice";
import { createTaskComment, deleteTaskComment, editTaskComment, resetCommentEdit } from "@/redux/slices/taskSlice";
import AddTaskModal from "@/components/Home/Task/AddTaskModal";

const Attachments = ({ attachments, id, getOpportunity }) => {
    const fileInputRef = useRef(null);
    const token = localStorage.getItem("token");
    const [files, setFiles] = useState(attachments);

    useEffect(() => {
        setFiles(attachments);
    }, [attachments]);

    const handleAttachFile = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event) => {
        const selectedFiles = Array.from(event.target.files);
        if (!selectedFiles.length) return;

        const formData = new FormData();
        selectedFiles.forEach((file) => {
            formData.append("opportunity[attachments][]", file);
        });

        try {
            await axios.put(`${baseURL}/opportunities/${id}.json`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            toast.success("Files uploaded successfully.");
            getOpportunity();
        } catch (error) {
            console.error("File upload failed:", error);
            toast.error("Failed to upload file.");
        }
    };

    const handleRemoveFile = async (fileId) => {
        try {
            await axios.delete(`${baseURL}/opportunities/${id}/attachments/${fileId}.json`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            toast.dismiss();
            toast.success("File removed successfully.");
        } catch (error) {
            console.error("File deletion failed:", error);
            toast.error("Failed to delete file.");
        }
    };

    return (
        <div className="flex flex-col gap-3 p-5">
            {files && files.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 mt-4">
                        {files.map((file, index) => {
                            const fileName = file.document_file_name || file.filename;
                            const fileUrl = file.document_url || file.url;
                            const fileExt = fileName?.split(".").pop().toLowerCase();

                            const isImage = ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(fileExt);
                            const isPdf = fileExt === "pdf";
                            const isWord = ["doc", "docx"].includes(fileExt);
                            const isExcel = ["xls", "xlsx"].includes(fileExt);

                            return (
                                <div
                                    key={index}
                                    className="border rounded p-2 flex flex-col items-center justify-center text-center shadow-sm bg-white relative"
                                >
                                    <Trash2
                                        size={20}
                                        color="#C72030"
                                        className="absolute top-2 right-2 cursor-pointer"
                                        onClick={() => handleRemoveFile(file.id)}
                                    />

                                    <div className="w-[100px] h-[100px] flex items-center justify-center bg-gray-100 rounded mb-2 overflow-hidden">
                                        {isImage ? (
                                            <img src={fileUrl} alt={fileName} className="object-contain h-full" />
                                        ) : isPdf ? (
                                            <span className="text-red-600 font-bold">PDF</span>
                                        ) : isWord ? (
                                            <span className="text-blue-600 font-bold">DOC</span>
                                        ) : isExcel ? (
                                            <span className="text-green-600 font-bold">XLS</span>
                                        ) : (
                                            <span className="text-gray-500 font-bold">FILE</span>
                                        )}
                                    </div>

                                    <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download={fileName}
                                        className="text-xs text-blue-700 hover:underline truncate w-full"
                                        title={fileName}
                                    >
                                        {fileName}
                                    </a>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        className="bg-[#C72030] h-[40px] w-[240px] text-white px-5 mt-4"
                        onClick={handleAttachFile}
                    >
                        Attach Files
                    </button>
                </>
            ) : (
                <div className="text-[14px] mt-2">
                    <span>No Documents Attached</span>
                    <div className="text-[#C2C2C2]">Drop or attach relevant documents here</div>
                    <button
                        className="bg-[#C72030] h-[40px] w-[240px] text-white px-5 mt-4"
                        onClick={handleAttachFile}
                    >
                        Attach Files
                    </button>
                </div>
            )}

            <input
                type="file"
                multiple
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
            />
        </div>
    );
};

function formatToDDMMYYYY_AMPM(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;
    hours = String(hours).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
}

const Comments = ({ comments, getOpportunity }) => {
    const token = localStorage.getItem("token");
    const currentUser = JSON.parse(localStorage.getItem("user"));
    const { id } = useParams();
    const [comment, setComment] = useState("");
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editedCommentText, setEditedCommentText] = useState("");
    const textareaRef = useRef(null);
    const dispatch = useDispatch();
    const { loading, success } = useSelector((state) => state.createTaskComment);
    const { loading: editLoading, success: editSuccess } = useSelector(
        (state) => state.editTaskComment
    );
    const { success: deleteSuccess } = useSelector(
        (state) => state.deleteTaskComment
    );
    const { fetchUsers: name } = useSelector((state) => state.fetchUsers);
    const { fetchActiveTags: tags } = useSelector(
        (state) => state.fetchActiveTags
    );

    useEffect(() => {
        dispatch(fetchUsers({ token }));
        dispatch(fetchActiveTags({ token }));
    }, [dispatch, token]);

    const mentionData = name
        ? name.map((user) => ({
            id: user.id.toString(),
            display: `${user.firstname} ${user.lastname}` || "Unknown User",
        }))
        : [];

    const tagData = tags
        ? tags.map((tag) => ({
            id: tag.id.toString(),
            display: tag.name,
        }))
        : [];

    const handleAddComment = async (e) => {
        if (e) e.preventDefault();
        if (!comment?.trim()) {
            toast.error("Comment cannot be empty", { duration: 1000 });
            return;
        }
        const payload = {
            comment: {
                body: comment,
                commentable_id: id,
                commentable_type: "Opportunity",
                commentor_id: JSON.parse(localStorage.getItem("user"))?.id,
                active: true,
            },
        };
        await dispatch(createTaskComment({ token, payload })).unwrap();
        getOpportunity();
    };

    const handleEdit = (comment) => {
        setEditingCommentId(comment.id);
        setEditedCommentText(comment.body);
    };

    const handleEditSave = async () => {
        if (!editedCommentText.trim()) {
            toast.error("Comment cannot be empty");
            return;
        }
        const formData = new FormData();
        formData.append("comment[body]", editedCommentText);
        await dispatch(
            editTaskComment({ token, id: editingCommentId, payload: formData })
        ).unwrap();
        getOpportunity();
    };

    const handleDelete = async (id) => {
        await dispatch(deleteTaskComment({ token, id })).unwrap();
        getOpportunity();
    };

    const handleCancel = () => {
        setEditingCommentId(null);
        setComment("");
        setEditedCommentText("");
    };

    useEffect(() => {
        if (success || editSuccess || deleteSuccess) {
            setComment("");
            setEditingCommentId(null);
            setEditedCommentText("");
            dispatch(resetCommentEdit());
        }
    }, [success, editSuccess, deleteSuccess, dispatch, id, token]);

    const mentionStyles = {
        control: {
            fontSize: 14,
            backgroundColor: "transparent",
            border: "none",
            outline: "none",
            padding: 0,
            margin: 0,
        },
        highlighter: { overflow: "hidden" },
        input: {
            font: "inherit",
            backgroundColor: "transparent",
            border: "none",
            padding: 0,
            margin: 0,
            outline: "none",
        },
        suggestions: {
            list: {
                backgroundColor: "white",
                border: "1px solid #ccc",
                fontSize: 14,
                zIndex: 100,
                maxHeight: "150px",
                overflowY: "auto",
                borderRadius: "4px",
            },
            item: {
                padding: "5px 10px",
                borderBottom: "1px solid #eee",
                cursor: "pointer",
            },
            itemFocused: {
                backgroundColor: "#01569E",
                color: "white",
                fontWeight: "bold",
            },
        },
    };

    return (
        <div className="text-[14px] flex flex-col gap-2">
            <div className="flex justify-start m-2 gap-5">
                <div className="bg-[#01569E] h-[36px] w-[36px] rounded-full text-white text-center p-1.5">
                    <span>
                        {`${currentUser?.firstname?.charAt(0) || ''}${currentUser?.lastname?.charAt(0) || ''}`}
                    </span>
                </div>
                <MentionsInput
                    inputRef={textareaRef}
                    value={comment}
                    onChange={(e, newValue) => setComment(newValue)}
                    className="mentions w-[95%] h-[70px] bg-[#F2F4F4] p-2 border-2 border-[#DFDFDF] focus:outline-none"
                    placeholder="Add comment here. Type @ to mention users. Type # to mention tags"
                    style={{
                        control: {
                            backgroundColor: "#F2F4F4",
                            fontSize: 14,
                            fontWeight: "normal",
                        },
                        highlighter: {
                            overflow: "hidden",
                        },
                        input: {
                            margin: 0,
                            padding: "8px",
                            outline: "none",
                        },
                        suggestions: {
                            list: {
                                backgroundColor: "white",
                                border: "1px solid #ccc",
                                fontSize: 14,
                                zIndex: 100,
                                position: "absolute",
                                bottom: "100%",
                                left: 0,
                                width: "200px",
                                maxHeight: "150px",
                                overflowY: "auto",
                                borderRadius: "4px",
                                marginBottom: "4px",
                            },
                            item: {
                                padding: "5px 10px",
                                borderBottom: "1px solid #eee",
                                cursor: "pointer",
                            },
                            itemFocused: {
                                backgroundColor: "#f5f5f5",
                            },
                        },
                    }}
                >
                    <Mention
                        trigger="@"
                        data={mentionData}
                        markup="@[__display__](__id__)"
                        displayTransform={(id, display) => `@${display}`}
                        appendSpaceOnAdd
                    />
                    <Mention
                        trigger="#"
                        data={tagData}
                        markup="#[__display__](__id__)"
                        displayTransform={(id, display) => `#${display}`}
                        appendSpaceOnAdd
                    />
                </MentionsInput>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    className="bg-red text-white h-[30px] px-3 cursor-pointer p-1 mr-2"
                    onClick={handleAddComment}
                    disabled={loading}
                >
                    Add Comment
                </button>
                <button
                    className="border-2 border-[#C72030] h-[30px] cursor-pointer p-1 px-3"
                    onClick={handleCancel}
                >
                    Cancel
                </button>
            </div>

            {comments?.map((cmt) => {
                const isEditing = editingCommentId === cmt.id;
                return (
                    <div key={cmt.id} className="relative flex justify-start m-2 gap-5">
                        <div className="bg-[#01569E] h-[36px] w-[36px] rounded-full text-white text-center p-1.5">
                            <span>{cmt?.commentor_full_name?.split(" ")[0]?.charAt(0)}{cmt?.commentor_full_name?.split(" ")[1]?.charAt(0)}</span>
                        </div>
                        <div className="flex flex-col gap-2 w-full border-b-[2px] pb-3 border-[rgba(190, 190, 190, 1)]">
                            <h1 className="font-bold">{cmt.commentor_full_name}</h1>

                            {isEditing ? (
                                <MentionsInput
                                    value={editedCommentText}
                                    inputRef={(el) => {
                                        if (el) {
                                            const val = el.value;
                                            el.focus();
                                            el.setSelectionRange(val.length, val.length);
                                        }
                                    }}
                                    onChange={(e, newValue) => setEditedCommentText(newValue)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            setTimeout(() => {
                                                handleEditSave();
                                            }, 100);
                                        }
                                    }}
                                    onBlur={handleEditSave}
                                    className="mentions w-full bg-transparent p-0 m-0 border-none outline-none"
                                    style={mentionStyles}
                                >
                                    <Mention
                                        trigger="@"
                                        data={mentionData}
                                        markup="@[__display__](__id__)"
                                        displayTransform={(id, display) => `@${display}`}
                                        appendSpaceOnAdd
                                    />
                                    <Mention
                                        trigger="#"
                                        data={tagData}
                                        markup="#[__display__](__id__)"
                                        displayTransform={(id, display) => `#${display}`}
                                        appendSpaceOnAdd
                                    />
                                </MentionsInput>
                            ) : (
                                <div>
                                    {cmt.body
                                        .replace(/@\[(.*?)\]\(\d+\)/g, "@$1")
                                        .replace(/#\[(.*?)\]\(\d+\)/g, "#$1")}
                                </div>
                            )}

                            <div className="flex gap-2 text-[10px]">
                                <span>{formatToDDMMYYYY_AMPM(cmt.created_at)}</span>
                                <span
                                    className="cursor-pointer"
                                    onClick={() => handleEdit(cmt)}
                                >
                                    Edit
                                </span>
                                <span
                                    className="cursor-pointer"
                                    onClick={() => handleDelete(cmt.id)}
                                >
                                    Delete
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const STATUS_COLORS = {
    open: "bg-[#E4636A] text-white",
    "in_progress": "bg-[#08AEEA] text-white",
    "on_hold": "bg-[#7BD2B5] text-black",
    completed: "bg-[#83D17A] text-white",
};

const mapStatusToDisplay = (rawStatus) => {
    const statusMap = {
        open: "Open",
        in_progress: "In Progress",
        on_hold: "On Hold",
        completed: "Completed",
    };
    return statusMap[rawStatus?.toLowerCase()] || "Open";
};

const mapDisplayToApiStatus = (displayStatus) => {
    const reverseStatusMap = {
        Open: "open",
        "In Progress": "in_progress",
        "On Hold": "on_hold",
        Completed: "completed",
    };
    return reverseStatusMap[displayStatus] || "open";
};

const OpportunityDetails = () => {
    const token = localStorage.getItem("token");
    const { opportunityId: id } = useParams();
    const navigate = useNavigate();

    const [isFirstCollapsed, setIsFirstCollapsed] = useState(false);
    const [isSecondCollapsed, setIsSecondCollapsed] = useState(false);
    const [tab, setTab] = useState("Comments");
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    const firstContentRef = useRef(null);
    const secondContentRef = useRef(null);

    const [openDropdown, setOpenDropdown] = useState(false);
    const [selectedOption, setSelectedOption] = useState("Open");
    const [opportunityDetails, setOpportunityDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const dropdownRef = useRef(null);

    const getOpportunity = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${baseURL}/opportunities/${id}.json`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setOpportunityDetails(response.data);
            setSelectedOption(mapStatusToDisplay(response.data.status));
        } catch (err) {
            console.error("Error fetching opportunity:", err);
            setError(err.message || "Failed to fetch opportunity details");
            toast.error("Failed to load opportunity details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getOpportunity();
    }, [id, token]);

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

    const dropdownOptions = ["Open", "In Progress", "On Hold", "Completed"];

    const handleOptionSelect = async (option) => {
        setSelectedOption(option);
        setOpenDropdown(false);
        const payload = {
            opportunity: {
                status: mapDisplayToApiStatus(option)
            }
        };
        try {
            await axios.put(`${baseURL}/opportunities/${id}.json`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            toast.dismiss();
            toast.success("Status updated successfully");
            await getOpportunity();
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        }
    };

    const handleConvertToTask = () => {
        setIsTaskModalOpen(true);
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

    if (loading) {
        return (
            <div className="m-4 flex items-center justify-center py-12">
                <p className="text-gray-600">Loading opportunity details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="m-4">
                <div className="flex items-center justify-center py-12 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-600">Error: {error}</p>
                </div>
            </div>
        );
    }

    if (!opportunityDetails) {
        return (
            <div className="m-4">
                <p className="text-center text-gray-600">Opportunity not found</p>
            </div>
        );
    }

    return (
        <div className="m-4">
            <div className="px-4 pt-1">
                <h2 className="text-[15px] p-3 px-0">
                    <span className="mr-3">OPP-{opportunityDetails?.id}</span>
                    <span>{opportunityDetails?.title}</span>
                </h2>

                <div className="border-b-[3px] border-[rgba(190, 190, 190, 1)]"></div>
                <div className="flex items-center justify-between my-3 text-[12px]">
                    <div className="flex items-center gap-3 text-[#323232]">
                        <span>Created By : {opportunityDetails?.created_by?.name || "N/A"}</span>

                        <span className="h-6 w-[1px] border border-gray-300"></span>

                        <span className="flex items-center gap-3">
                            Created On : {formatToDDMMYYYY_AMPM(opportunityDetails?.created_at)}
                        </span>

                        <span className="h-6 w-[1px] border border-gray-300"></span>

                        <span className={`flex items-center gap-2 cursor-pointer px-2 py-1 rounded-md text-sm ${STATUS_COLORS[mapDisplayToApiStatus(selectedOption).toLowerCase()] || "bg-gray-400 text-white"}`}>
                            <div className="relative" ref={dropdownRef}>
                                <div
                                    className="flex items-center gap-1 cursor-pointer px-2 py-1"
                                    onClick={() => setOpenDropdown(!openDropdown)}
                                    role="button"
                                    aria-haspopup="true"
                                    aria-expanded={openDropdown}
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === "Enter" && setOpenDropdown(!openDropdown)}
                                >
                                    <span className="text-[13px]">{selectedOption}</span>
                                    <ChevronDown
                                        size={15}
                                        className={`${openDropdown ? "rotate-180" : ""} transition-transform`}
                                    />
                                </div>
                                <ul
                                    className={`dropdown-menu absolute right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden ${openDropdown ? "block" : "hidden"}`}
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
                                                className={`dropdown-item w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-100 ${selectedOption === option ? "bg-gray-100 font-semibold" : ""}`}
                                                onClick={() => handleOptionSelect(option)}
                                            >
                                                {option}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </span>

                        <span className="h-6 w-[1px] border border-gray-300"></span>

                        {
                            !opportunityDetails.task_created && (
                                <span
                                    className="cursor-pointer flex items-center gap-1"
                                    onClick={handleConvertToTask}
                                >
                                    <CircleCheckBig className="mx-1" size={15} /> Convert to Task
                                </span>
                            )
                        }
                    </div>
                </div>
                <div className="border-b-[3px] border-grey my-3"></div>

                <div className="border rounded-md shadow-custom p-5 mb-4 text-[14px]">
                    <div className="font-[600] text-[16px] flex items-center gap-4">
                        <ChevronDownCircle
                            color="#E95420"
                            size={30}
                            className={`${isFirstCollapsed ? "rotate-180" : "rotate-0"} transition-transform cursor-pointer`}
                            onClick={toggleFirstCollapse}
                        />
                        Description
                    </div>
                    <div className="mt-3 overflow-hidden" ref={firstContentRef}>
                        <p>{opportunityDetails?.description || "No description provided"}</p>
                    </div>
                </div>

                {/* <div className="border rounded-md shadow-custom p-5 mb-4">
                    <div className="font-[600] text-[16px] flex items-center gap-4" onClick={toggleSecondCollapse}>
                        <ChevronDownCircle
                            color="#E95420"
                            size={30}
                            className={`${isSecondCollapsed ? "rotate-180" : "rotate-0"} transition-transform`}
                        />
                        Details
                    </div>

                    <div className="mt-3 overflow-hidden" ref={secondContentRef}>
                        <div className="flex flex-col">
                            <div className="flex items-center ml-36">
                                <div className="w-1/2 flex items-center justify-start gap-3">
                                    <div className="text-right text-[12px] font-[500]">
                                        Assigned To :
                                    </div>
                                    <div className="text-left text-[12px]">{opportunityDetails?.assigned_to || "Unassigned"}</div>
                                </div>
                                <div className="w-1/2 flex items-center justify-start gap-3">
                                    <div className="text-right text-[12px] font-[500]">
                                        Probability :
                                    </div>
                                    <div className="text-left text-[12px]">{opportunityDetails?.probability || "N/A"}</div>
                                </div>
                            </div>

                            <span className="border h-[1px] inline-block w-full my-4"></span>

                            <div className="flex items-center ml-36">
                                <div className="w-1/2 flex items-center justify-start gap-3">
                                    <div className="text-right text-[12px] font-[500]">
                                        Estimated Value :
                                    </div>
                                    <div className="text-left text-[12px]">{opportunityDetails?.estimated_value || "N/A"}</div>
                                </div>
                                <div className="w-1/2 flex items-center justify-start gap-3">
                                    <div className="text-right text-[12px] font-[500]">
                                        Expected Closure Date :
                                    </div>
                                    <div className="text-left text-[12px]">{opportunityDetails?.expected_closure_date ? opportunityDetails.expected_closure_date.split("T")[0] : "N/A"}</div>
                                </div>
                            </div>

                            <span className="border h-[1px] inline-block w-full my-4"></span>

                            <div className="flex items-center ml-36">
                                <div className="w-1/2 flex items-center justify-start gap-3">
                                    <div className="text-right text-[12px] font-[500]">
                                        Project :
                                    </div>
                                    <div className="text-left text-[12px]">{opportunityDetails?.project || "N/A"}</div>
                                </div>
                                <div className="w-1/2 flex items-center justify-start gap-3">
                                    <div className="text-right text-[12px] font-[500]">
                                        Task :
                                    </div>
                                    <div className="text-left text-[12px]">{opportunityDetails?.task || "N/A"}</div>
                                </div>
                            </div>

                            <span className="border h-[1px] inline-block w-full my-4"></span>

                            <div className="flex items-center ml-36">
                                <div className="w-1/2 flex items-center justify-start gap-3">
                                    <div className="text-right text-[12px] font-[500]">
                                        Notes :
                                    </div>
                                    <div className="text-left text-[12px]">{opportunityDetails?.notes || "No notes"}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div> */}

                <div>
                    <div className="flex items-center justify-between my-3">
                        <div className="flex items-center gap-10">
                            {["Comments", "Documents"].map((item) => (
                                <div
                                    key={item}
                                    className={`text-[14px] font-[400] ${tab === item ? "selected" : "cursor-pointer"}`}
                                    onClick={() => setTab(item)}
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="border-b-[3px] border-[rgba(190, 190, 190, 1)]"></div>

                    <div>
                        {tab === "Documents" && <Attachments attachments={opportunityDetails?.attachments || []} id={opportunityDetails?.id} getOpportunity={getOpportunity} />}
                        {tab === "Comments" && <Comments comments={opportunityDetails?.comments || []} getOpportunity={getOpportunity} />}
                    </div>
                </div>
            </div>
            {isTaskModalOpen && (
                <AddTaskModal
                    title="Convert to Task"
                    isEdit={false}
                    isModalOpen={isTaskModalOpen}
                    setIsModalOpen={setIsTaskModalOpen}
                    prefillData={{
                        title: opportunityDetails?.title,
                        project: opportunityDetails?.project_management_id,
                        projectName: opportunityDetails?.project_name,
                        task: opportunityDetails?.task_management_id,
                        taskName: opportunityDetails?.task_name,
                        description: opportunityDetails?.description,
                        opportunityId: id,
                    }}
                />
            )}
        </div>
    );
};

export default OpportunityDetails;
