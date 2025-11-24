import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronDownCircle } from "lucide-react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchSpirintById, putSprint } from "../../../redux/slices/spirintSlice";
import toast from "react-hot-toast";
import SprintTasksTable from "@/components/SprintTasksTable";

const STATUS_COLORS = {
  active: "bg-[#E4636A] text-white",
  "in_progress": "bg-[#08AEEA] text-white",
  "on_hold": "bg-[#7BD2B5] text-black",
  overdue: "bg-[#FF2733] text-white",
  completed: "bg-[#83D17A] text-black",
};

const dropdownOptions = [
  "Active",
  "In Progress",
  "On Hold",
  "Overdue",
  "Completed",
];

const mapStatusToDisplay = (rawStatus) => {
  const statusMap = {
    active: "Active",
    in_progress: "In Progress",
    on_hold: "On Hold",
    overdue: "Overdue",
    completed: "Completed",
    stopped: "Stopped",
  };
  return statusMap[rawStatus?.toLowerCase()];
};

const mapDisplayToApiStatus = (displayStatus) => {
  const reverseStatusMap = {
    Active: "active",
    "In Progress": "in_progress",
    "On Hold": "on_hold",
    Overdue: "overdue",
    Completed: "completed",
  };
  return reverseStatusMap[displayStatus] || "open";
};

const SprintDetails = () => {
  const [isSecondCollapsed, setIsSecondCollapsed] = useState(false);
  const [selectedOption, setSelectedOption] = useState("Active");
  const [tab, setTab] = useState("Tasks")
  const [openDropdown, setOpenDropdown] = useState(false)
  const dropdownRef = useRef(null);
  const secondContentRef = useRef(null);
  const { sid } = useParams()

  const dispatch = useDispatch();
  const token = localStorage.getItem("token");


  const { fetchSpirintById: newSprint } = useSelector(
    (state) => state.fetchSpirintById
  );

  useEffect(() => {
    dispatch(fetchSpirintById({ token, id: sid }));
  }, [dispatch, sid]);

  // Format date to DD/MM/YYYY HH:MM AM/PM
  const formatToDDMMYYYY_AMPM = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const toggleSecondCollapse = () => setIsSecondCollapsed(!isSecondCollapsed);

  useEffect(() => {
    if (newSprint?.status) {
      setSelectedOption(mapStatusToDisplay(newSprint.status));
    }
  }, [newSprint?.status]);

  const handleOptionSelect = async (option) => {
    setSelectedOption(option);
    setOpenDropdown(false);

    await dispatch(
      putSprint({
        token,
        id: sid,
        payload: {
          sprint: { status: mapDisplayToApiStatus(option) },
        },
      })
    ).unwrap();
    toast.dismiss();
    toast.success("Status updated successfully");
  };

  return (
    <div className="m-4">
      <div className="px-4 pt-1">
        <h2 className="text-[15px] p-3 px-0">
          <span className="mr-3">S-{newSprint.id}</span>
          <span>{newSprint.name}</span>
        </h2>
        <div className="border-b-[3px] border-[rgba(190, 190, 190, 1)]"></div>
        <div className="flex items-center justify-between my-3 text-[12px]">
          <div className="flex items-center gap-3 text-[#323232]">
            <span>Created By: {newSprint.sprint_created_by_name}</span>
            <span className="h-6 w-[1px] border border-gray-300"></span>
            <span className="flex items-center gap-3">
              Created On: {formatToDDMMYYYY_AMPM(newSprint.created_at)}
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
                  onKeyDown={(e) =>
                    e.key === "Enter" && setOpenDropdown(!openDropdown)
                  }
                >
                  <span className="text-[13px]">{selectedOption}</span>{" "}
                  {/* Display selected option */}
                  <ChevronDown
                    size={15}
                    className={`${openDropdown ? "rotate-180" : ""
                      } transition-transform`}
                  />
                </div>
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
              </div>
            </span>
          </div>
        </div>
        <div className="border-b-[3px] border-[rgba(190, 190, 190, 1)] my-3"></div>
        <div className="border rounded-md shadow-[0_4px_6px_rgba(0,0,0,0.1)] p-5 mb-4">
          <div className="font-[600] text-[16px] flex items-center gap-4" onClick={toggleSecondCollapse}>
            <ChevronDownCircle
              color="#E95420"
              size={30}
              className={`${isSecondCollapsed ? "rotate-180" : ""} transition-transform`}
            />
            Details
          </div>
          <div className={`mt-3 ${isSecondCollapsed ? "h-0 overflow-hidden" : ""}`} ref={secondContentRef}>
            <div className="flex flex-col">
              <div className="flex items-center ml-36">
                <div className="w-1/2 flex items-center justify-start gap-3">
                  <div className="text-right text-[12px] font-[500]">Responsible Person:                  </div>
                  <div className="text-left text-[12px]">{newSprint.sprint_owner_name}</div>
                </div>
              </div>
              <span className="border h-[1px] inline-block w-full my-4"></span>
              <div className="flex items-center ml-36">
                <div className="w-1/2 flex items-center justify-start gap-3">
                  <div className="text-right text-[12px] font-[500]">Priority:</div>
                  <div className="text-left text-[12px]">
                    {newSprint.priority}
                  </div>
                </div>
              </div>
              <span className="border h-[1px] inline-block w-full my-4"></span>
              <div className="flex items-center ml-36">
                <div className="w-1/2 flex items-center justify-start gap-3">
                  <div className="text-right text-[12px] font-[500]">Start Date:</div>
                  <div className="text-left text-[12px]">{newSprint.start_date}</div>
                </div>
              </div>
              <span className="border h-[1px] inline-block w-full my-4"></span>
              <div className="flex items-center ml-36">
                <div className="w-1/2 flex items-center justify-start gap-3">
                  <div className="text-right text-[12px] font-[500]">End Date:</div>
                  <div className="text-left text-[12px]">{newSprint.end_date}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between my-3">
            <div className="flex items-center gap-10">
              {["Tasks"].map((item, idx) => (
                <div
                  key={item}
                  id={idx + 1}
                  className={`text-[14px] font-[400] ${tab === item ? "selected" : "cursor-pointer"
                    }`}
                  onClick={() => setTab(item)}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="border-b-[3px] border-[rgba(190, 190, 190, 1)]"></div>

          <div>
            {tab == "Tasks" && (
              <SprintTasksTable sprint={newSprint} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SprintDetails;