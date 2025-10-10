// // const MomTasks = ({ tasks = [] }) => {
// //   return (
// //     <div className="text-[14px] font-light my-4">
// //       <div className="overflow-x-auto rounded-md border border-gray-300">
// //         <table className="w-full">
// //           <thead>
// //             <tr>
// //               <th className="px-4 py-4">Task ID</th>
// //               <th className="px-4 py-4 w-[25%]">Task</th>
// //               <th className="px-4 py-4">Raised By</th>
// //               <th className="px-4 py-4 w-[15%]">Responsible Person</th>
// //               <th className="px-4 py-4">End Date</th>
// //               <th className="px-4 py-4">Status</th>
// //             </tr>
// //           </thead>
// //           <tbody>
// //             {tasks.filter(task => task.save_task === true).length > 0 ? (
// //               tasks.filter(task => task.save_task === true).map(task => (
// //                 <tr>
// //                   <td className="p-4">{task.id}</td>
// //                   <td className="p-4">{task.description}</td>
// //                   <td className="p-4" style={{ padding: "1rem" }}>{task.raised_by || "N/A"}</td>
// //                   <td className="p-4">{task.responsible_person_name || "N/A"}</td>
// //                   <td className="p-4">{task.target_date}</td>
// //                   <td className="p-4">{task.status || "N/A"}</td>
// //                 </tr>
// //               ))
// //             ) : (
// //               <tr>
// //                 <td colSpan="8" className="text-center py-6 text-gray-500">
// //                   No Tasks
// //                 </td>
// //               </tr>
// //             )}
// //           </tbody>

// //         </table>
// //       </div>
// //     </div>
// //   )
// // }

// // export default MomTasks





// const MomTasks = ({ tasks = [] }) => {
//   return (
//     <div className="text-sm font-light my-6">
//       <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-sm bg-white">
//         <table className="w-full border-collapse">
//           <thead className="bg-gray-100 text-gray-700 text-left">
//             <tr>
//               <th className="px-4 py-3 w-[6rem]">Task ID</th>
//               <th className="px-4 py-3 w-[30%]">Task</th>
//               <th className="px-4 py-3 w-[15%]">Raised By</th>
//               <th className="px-4 py-3 w-[20%]">Responsible Person</th>
//               <th className="px-4 py-3 w-[12%]">End Date</th>
//               <th className="px-4 py-3 w-[10%]">Status</th>
//             </tr>
//           </thead>

//           <tbody className="divide-y divide-gray-200 text-gray-700">
//             {tasks.length > 0 ? (
//               tasks.map((task) => (
//                 <tr
//                   key={task.id}
//                   className="hover:bg-gray-50 transition-colors duration-150"
//                 >
//                   <td className="px-4 py-3 text-gray-600">{task.id}</td>

//                   <td className="px-4 py-3 max-w-[22rem] truncate">
//                     {task.description || "—"}
//                   </td>

//                   <td className="px-4 !py-3 text-gray-600">
//                     {task.raised_by || "N/A"}
//                   </td>

//                   <td className="px-4 py-3 max-w-[12rem] truncate">
//                     {task.responsible_person_name || "N/A"}
//                   </td>

//                   <td className="px-4 py-3 whitespace-nowrap">
//                     {task.target_date || "—"}
//                   </td>

//                   <td className="px-4 py-3 font-medium">
//                     {task.status ? (
//                       <span
//                         className={`px-2 py-1 rounded-full text-xs font-semibold ${task.status === "Completed"
//                           ? "bg-green-100 text-green-700"
//                           : task.status === "In Progress"
//                             ? "bg-yellow-100 text-yellow-700"
//                             : "bg-gray-100 text-gray-600"
//                           }`}
//                       >
//                         {task.status}
//                       </span>
//                     ) : (
//                       "N/A"
//                     )}
//                   </td>
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td
//                   colSpan="6"
//                   className="text-center py-8 text-gray-500 italic"
//                 >
//                   No Tasks Available
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default MomTasks;





import { useState } from "react";

const MomTasks = ({ tasks = [] }) => {
  const [hoveredTaskId, setHoveredTaskId] = useState(null);

  return (
    <div className="text-sm font-light my-6">
      <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-sm bg-white">
        <table className="w-full border-collapse relative">
          <thead className="bg-gray-100 text-gray-700 text-left">
            <tr>
              <th className="px-4 py-3 w-[6rem]">Task ID</th>
              <th className="px-4 py-3 w-[30%]">Task</th>
              <th className="px-4 py-3 w-[15%]">Raised By</th>
              <th className="px-4 py-3 w-[20%]">Responsible Person</th>
              <th className="px-4 py-3 w-[12%]">End Date</th>
              <th className="px-4 py-3 w-[10%]">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 text-gray-700">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <tr
                  key={task.id}
                  className="hover:bg-gray-50 transition-colors duration-150 relative"
                >
                  <td className="px-4 py-3 text-gray-600">{task.id}</td>

                  {/* ✅ Description with custom tooltip */}
                  <td
                    className="px-4 py-3 max-w-[22rem] truncate relative cursor-pointer"
                    onMouseEnter={() => setHoveredTaskId(task.id)}
                    onMouseLeave={() => setHoveredTaskId(null)}
                  >
                    {task.description || "—"}

                    {/* Tooltip */}
                    {hoveredTaskId === task.id && task.description && (
                      <div className="absolute z-10 left-0 top-full mt-1 w-max max-w-[24rem] bg-gray-900 text-white text-xs px-3 py-2 rounded-md shadow-lg whitespace-normal break-words">
                        {task.description}
                        <div className="absolute -top-1 left-3 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    )}
                  </td>

                  <td className="px-4 !py-3 text-gray-600">
                    {task.raised_by || "N/A"}
                  </td>

                  <td className="px-4 py-3 max-w-[12rem] truncate">
                    {task.responsible_person_name || "N/A"}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {task.target_date || "—"}
                  </td>

                  <td className="px-4 py-3 font-medium">
                    {task.status ? (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${task.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : task.status === "In Progress"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                      >
                        {task.status}
                      </span>
                    ) : (
                      "N/A"
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-8 text-gray-500 italic"
                >
                  No Tasks Available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MomTasks;
