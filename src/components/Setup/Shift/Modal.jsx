/* eslint-disable react/prop-types */
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateShift, createShift } from "../../../redux/slices/shiftSlice";
import toast from "react-hot-toast";
import SelectBox from "../../SelectBox";

const AddShiftModel = ({
  setOpenModal,
  openModal,
  isEditMode = false,
  initialData = null,
  onSuccess,
}) => {
  const token = localStorage.getItem("token");
  const dispatch = useDispatch();

  const { loading } = useSelector((state) => state.createShift);
  const { loading: editLoading } = useSelector((state) => state.updateShift);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    fromTime: "",
    toTime: "",
    breakFromTime: "",
    breakToTime: "",
  });
  const [formData, setFormData] = useState({
    fromHour: "",
    fromMinute: "",
    fromPeriod: "AM",
    toHour: "",
    toMinute: "",
    toPeriod: "PM",
    breakFromHour: "",
    breakFromMinute: "",
    breakFromPeriod: "AM",
    breakToHour: "",
    breakToMinute: "",
    breakToPeriod: "PM",
    checkInMargin: false,
    marginHours: "0",
    marginMinutes: "00",
  });

  // Generate hours 01-12
  const hours = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: String(i + 1).padStart(2, '0')
  }));

  // Generate minutes 00-59
  const minutes = Array.from({ length: 60 }, (_, i) => ({
    value: String(i).padStart(2, '0'),
    label: String(i).padStart(2, '0')
  }));

  // Period options
  const periods = [
    { value: 'AM', label: 'AM' },
    { value: 'PM', label: 'PM' }
  ];

  // Hours for margin (0-23)
  const marginHoursOptions = Array.from({ length: 24 }, (_, i) => ({
    value: String(i),
    label: String(i)
  }));

  // Convert 24-hour format to 12-hour format
  const convertTo12Hour = (hour24) => {
    const hourNum = parseInt(hour24);
    if (hourNum === 0) return { hour: '12', period: 'AM' };
    if (hourNum < 12) return { hour: String(hourNum).padStart(2, '0'), period: 'AM' };
    if (hourNum === 12) return { hour: '12', period: 'PM' };
    return { hour: String(hourNum - 12).padStart(2, '0'), period: 'PM' };
  };

  useEffect(() => {
    if (isEditMode && initialData) {
      // Convert 24-hour format from API to 12-hour format for display
      const startHour24 = initialData.start_hour || 0;
      const endHour24 = initialData.end_hour || 0;

      const startTime = convertTo12Hour(startHour24);
      const endTime = convertTo12Hour(endHour24);

      const startMin = String(initialData.start_min || 0).padStart(2, '0');
      const endMin = String(initialData.end_min || 0).padStart(2, '0');
      const marginHours = String(initialData.hour_margin || 0);
      const marginMinutes = String(initialData.min_margin || 0).padStart(2, '0');

      // Check if break time data exists
      const hasBreakData = initialData.break_start_hour != null && initialData.break_start_min != null;

      let breakFromHour = "";
      let breakFromMinute = "";
      let breakFromPeriod = "AM";
      let breakToHour = "";
      let breakToMinute = "";
      let breakToPeriod = "PM";

      if (hasBreakData) {
        const breakStartHour24 = initialData.break_start_hour || 0;
        const breakEndHour24 = initialData.break_end_hour || 0;

        const breakStartTime = convertTo12Hour(breakStartHour24);
        const breakEndTime = convertTo12Hour(breakEndHour24);

        breakFromHour = breakStartTime.hour;
        breakFromMinute = String(initialData.break_start_min || 0).padStart(2, '0');
        breakFromPeriod = breakStartTime.period;
        breakToHour = breakEndTime.hour;
        breakToMinute = String(initialData.break_end_min || 0).padStart(2, '0');
        breakToPeriod = breakEndTime.period;
      }

      // Check if check_in_margin exists and has a value
      const hasCheckInMargin = initialData.check_in_margin &&
        initialData.check_in_margin.trim() !== '' &&
        initialData.check_in_margin !== '0h:0m';

      setFormData({
        fromHour: startTime.hour,
        fromMinute: startMin,
        fromPeriod: startTime.period,
        toHour: endTime.hour,
        toMinute: endMin,
        toPeriod: endTime.period,
        breakFromHour: breakFromHour,
        breakFromMinute: breakFromMinute,
        breakFromPeriod: breakFromPeriod,
        breakToHour: breakToHour,
        breakToMinute: breakToMinute,
        breakToPeriod: breakToPeriod,
        checkInMargin: hasCheckInMargin,
        marginHours: marginHours,
        marginMinutes: marginMinutes,
      });
    }
    setError("");
    setFieldErrors({ fromTime: "", toTime: "", breakFromTime: "", breakToTime: "" });
  }, [isEditMode, initialData]);

  const calculateTotalHours = () => {
    let fromHour = parseInt(formData.fromHour);
    let toHour = parseInt(formData.toHour);

    // Convert to 24-hour format
    if (formData.fromPeriod === 'PM' && fromHour !== 12) fromHour += 12;
    if (formData.fromPeriod === 'AM' && fromHour === 12) fromHour = 0;
    if (formData.toPeriod === 'PM' && toHour !== 12) toHour += 12;
    if (formData.toPeriod === 'AM' && toHour === 12) toHour = 0;

    let totalMinutes = (toHour * 60 + parseInt(formData.toMinute)) - (fromHour * 60 + parseInt(formData.fromMinute));
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle overnight shifts

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    return `${hours}h ${mins}m`;
  };

  const convertTo24Hour = (hour, period) => {
    let hourNum = parseInt(hour);
    if (period === 'AM' && hourNum === 12) {
      hourNum = 0;
    } else if (period === 'PM' && hourNum !== 12) {
      hourNum += 12;
    }
    return String(hourNum).padStart(2, '0');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({ fromTime: "", toTime: "", breakFromTime: "", breakToTime: "" });

    // Validation
    let hasError = false;
    const errors = { fromTime: "", toTime: "", breakFromTime: "", breakToTime: "" };

    if (!formData.fromHour || !formData.fromMinute) {
      errors.fromTime = "Please select Hour and Minute";
      hasError = true;
    }

    if (!formData.toHour || !formData.toMinute) {
      errors.toTime = "Please select Hour and Minute";
      hasError = true;
    }

    // Validate break times only if at least one break field is filled
    const hasAnyBreakField = formData.breakFromHour || formData.breakFromMinute ||
      formData.breakToHour || formData.breakToMinute;

    if (hasAnyBreakField) {
      if (!formData.breakFromHour || !formData.breakFromMinute) {
        errors.breakFromTime = "Please select Hour and Minute";
        hasError = true;
      }

      if (!formData.breakToHour || !formData.breakToMinute) {
        errors.breakToTime = "Please select Hour and Minute";
        hasError = true;
      }
    }

    if (hasError) {
      setFieldErrors(errors);
      return;
    }

    // Convert to 24-hour format
    const start_hour_24 = convertTo24Hour(formData.fromHour, formData.fromPeriod);
    const end_hour_24 = convertTo24Hour(formData.toHour, formData.toPeriod);

    // Only include break times in payload if they are filled
    const payload = {
      user_shift: {
        start_hour: start_hour_24,
        start_min: formData.fromMinute,
        start_period: formData.fromPeriod,
        end_hour: end_hour_24,
        end_min: formData.toMinute,
        end_period: formData.toPeriod,
        hour_margin: formData.marginHours,
        min_margin: formData.marginMinutes,
      },
      check_in_margin: formData.checkInMargin,
    };

    // Add break times to payload only if they exist
    if (formData.breakFromHour && formData.breakFromMinute &&
      formData.breakToHour && formData.breakToMinute) {
      const break_start_hour_24 = convertTo24Hour(formData.breakFromHour, formData.breakFromPeriod);
      const break_end_hour_24 = convertTo24Hour(formData.breakToHour, formData.breakToPeriod);

      payload.user_shift.break_start_hour = break_start_hour_24;
      payload.user_shift.break_start_min = formData.breakFromMinute;
      payload.user_shift.break_end_hour = break_end_hour_24;
      payload.user_shift.break_end_min = formData.breakToMinute;
    }

    try {
      let result;
      if (isEditMode && initialData?.id) {
        result = await dispatch(
          updateShift({ token, id: initialData.id, payload })
        ).unwrap();
      } else {
        result = await dispatch(createShift({ token, payload })).unwrap();
      }

      if (result?.errors) {
        setError(
          typeof result.errors === "string"
            ? result.errors
            : "Validation error occurred."
        );
      } else {
        toast.success(
          `Shift ${isEditMode ? "updated" : "created"} successfully`,
          {
            iconTheme: {
              primary: "green",
              secondary: "white",
            },
          }
        );
        handleSuccess();
      }
    } catch (err) {
      console.error("Shift submit error:", err);
      setError(err?.message || "Something went wrong.");
    }
  };

  const handleSuccess = () => {
    setFormData({
      fromHour: "",
      fromMinute: "",
      fromPeriod: "AM",
      toHour: "",
      toMinute: "",
      toPeriod: "PM",
      breakFromHour: "",
      breakFromMinute: "",
      breakFromPeriod: "AM",
      breakToHour: "",
      breakToMinute: "",
      breakToPeriod: "PM",
      checkInMargin: true,
      marginHours: "0",
      marginMinutes: "00",
    });
    setError("");
    onSuccess();
  };

  const handleClose = () => {
    setFormData({
      fromHour: "",
      fromMinute: "",
      fromPeriod: "AM",
      toHour: "",
      toMinute: "",
      toPeriod: "PM",
      breakFromHour: "",
      breakFromMinute: "",
      breakFromPeriod: "AM",
      breakToHour: "",
      breakToMinute: "",
      breakToPeriod: "PM",
      checkInMargin: true,
      marginHours: "0",
      marginMinutes: "00",
    });
    setError("");
    setOpenModal(false);
  };

  if (!openModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
      <div className="w-[500px] h-max bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-[16px] font-semibold text-[#1B1B1B]">
            {isEditMode ? "Edit Shift" : "Create Shift"}
          </h2>
          <CloseIcon
            className="cursor-pointer text-gray-500 hover:text-gray-700"
            onClick={handleClose}
            sx={{ fontSize: 20 }}
          />
        </div>

        {/* Form Fields */}
        <div className="px-6 py-4 space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto">
          {/* Shift Timings From */}
          <div>
            <label className="block text-[12px] text-[#1B1B1B] mb-2">
              Shift Timings From <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="w-40">
                <SelectBox
                  options={hours}
                  value={formData.fromHour}
                  onChange={(value) => {
                    setFormData({ ...formData, fromHour: value });
                    setFieldErrors({ ...fieldErrors, fromTime: "" });
                  }}
                  placeholder="Hr"
                />
              </div>
              <span className="text-[14px]">:</span>
              <div className="w-40">
                <SelectBox
                  options={minutes}
                  value={formData.fromMinute}
                  onChange={(value) => {
                    setFormData({ ...formData, fromMinute: value });
                    setFieldErrors({ ...fieldErrors, fromTime: "" });
                  }}
                  placeholder="mm"
                />
              </div>
              <div className="w-24">
                <SelectBox
                  options={periods}
                  value={formData.fromPeriod}
                  onChange={(value) => setFormData({ ...formData, fromPeriod: value })}
                  placeholder="AM"
                />
              </div>
            </div>
            {fieldErrors.fromTime && (
              <span className="text-red-500 text-[11px] mt-1 block">{fieldErrors.fromTime}</span>
            )}
          </div>

          <div>
            <label className="block text-[12px] text-[#1B1B1B] mb-2">
              Break Timings From
            </label>
            <div className="flex items-center gap-2">
              <div className="w-40">
                <SelectBox
                  options={hours}
                  value={formData.breakFromHour}
                  onChange={(value) => {
                    setFormData({ ...formData, breakFromHour: value });
                    setFieldErrors({ ...fieldErrors, breakFromTime: "" });
                  }}
                  placeholder="Hr"
                />
              </div>
              <span className="text-[14px]">:</span>
              <div className="w-40">
                <SelectBox
                  options={minutes}
                  value={formData.breakFromMinute}
                  onChange={(value) => {
                    setFormData({ ...formData, breakFromMinute: value });
                    setFieldErrors({ ...fieldErrors, breakFromTime: "" });
                  }}
                  placeholder="mm"
                />
              </div>
              <div className="w-24">
                <SelectBox
                  options={periods}
                  value={formData.breakFromPeriod}
                  onChange={(value) => setFormData({ ...formData, breakFromPeriod: value })}
                  placeholder="AM"
                />
              </div>
            </div>
            {fieldErrors.breakFromTime && (
              <span className="text-red-500 text-[11px] mt-1 block">{fieldErrors.breakFromTime}</span>
            )}
          </div>

          {/* Break To */}
          <div>
            <label className="block text-[12px] text-[#1B1B1B] mb-2">
              Break Timings To
            </label>
            <div className="flex items-center gap-2">
              <div className="w-40">
                <SelectBox
                  options={hours}
                  value={formData.breakToHour}
                  onChange={(value) => {
                    setFormData({ ...formData, breakToHour: value });
                    setFieldErrors({ ...fieldErrors, breakToTime: "" });
                  }}
                  placeholder="Hr"
                />
              </div>
              <span className="text-[14px]">:</span>
              <div className="w-40">
                <SelectBox
                  options={minutes}
                  value={formData.breakToMinute}
                  onChange={(value) => {
                    setFormData({ ...formData, breakToMinute: value });
                    setFieldErrors({ ...fieldErrors, breakToTime: "" });
                  }}
                  placeholder="mm"
                />
              </div>
              <div className="w-24">
                <SelectBox
                  options={periods}
                  value={formData.breakToPeriod}
                  onChange={(value) => setFormData({ ...formData, breakToPeriod: value })}
                  placeholder="PM"
                />
              </div>
            </div>
            {fieldErrors.breakToTime && (
              <span className="text-red-500 text-[11px] mt-1 block">{fieldErrors.breakToTime}</span>
            )}
          </div>

          {/* Shift Timings To */}
          <div>
            <label className="block text-[12px] text-[#1B1B1B] mb-2">
              Shift Timings To <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="w-40">
                <SelectBox
                  options={hours}
                  value={formData.toHour}
                  onChange={(value) => {
                    setFormData({ ...formData, toHour: value });
                    setFieldErrors({ ...fieldErrors, toTime: "" });
                  }}
                  placeholder="Hr"
                />
              </div>
              <span className="text-[14px]">:</span>
              <div className="w-40">
                <SelectBox
                  options={minutes}
                  value={formData.toMinute}
                  onChange={(value) => {
                    setFormData({ ...formData, toMinute: value });
                    setFieldErrors({ ...fieldErrors, toTime: "" });
                  }}
                  placeholder="mm"
                />
              </div>
              <div className="w-24">
                <SelectBox
                  options={periods}
                  value={formData.toPeriod}
                  onChange={(value) => setFormData({ ...formData, toPeriod: value })}
                  placeholder="PM"
                />
              </div>
            </div>
            {fieldErrors.toTime && (
              <span className="text-red-500 text-[11px] mt-1 block">{fieldErrors.toTime}</span>
            )}
          </div>

          {/* Check In Margin */}
          <div>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={formData.checkInMargin}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setFormData({
                    ...formData,
                    checkInMargin: isChecked,
                    // Reset margin values when unchecked
                    marginHours: isChecked ? formData.marginHours : "0",
                    marginMinutes: isChecked ? formData.marginMinutes : "00",
                  });
                }}
                className="w-4 h-4 accent-[#C72030] border-gray-300 rounded focus:ring-[#C72030]"
              />
              <span className="text-[12px] text-[#1B1B1B]">Check In Margin</span>
            </label>

            {formData.checkInMargin && (
              <div>
                <label className="block text-[11px] text-[#666] mb-2">
                  Margin Time
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-20">
                    <SelectBox
                      options={marginHoursOptions}
                      value={formData.marginHours}
                      onChange={(value) => setFormData({ ...formData, marginHours: value })}
                      placeholder="0"
                    />
                  </div>
                  <span className="text-[12px] text-[#666]">hours</span>
                  <div className="w-20">
                    <SelectBox
                      options={minutes}
                      value={formData.marginMinutes}
                      onChange={(value) => setFormData({ ...formData, marginMinutes: value })}
                      placeholder="0"
                    />
                  </div>
                  <span className="text-[12px] text-[#666]">minutes</span>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-500 text-[11px] bg-red-50 p-2 rounded">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-[13px] text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || editLoading}
            className="px-6 py-2 text-[13px] text-white bg-[#C72030] rounded hover:bg-[#a01828] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading || editLoading
              ? "Creating..."
              : isEditMode
                ? "Update"
                : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddShiftModel;
