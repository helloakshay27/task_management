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

import { Tooltip } from "../../Tooltip";

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





const MomTasks = ({ tasks = [] }) => {
  return (
    <div className="text-sm font-light my-6">
      <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-sm bg-white">
        <table className="w-full border-collapse">
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
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-4 py-3 text-gray-600">{task.id}</td>

                  <td className="px-4 py-3 max-w-[22rem]">
                    <Tooltip content={task.description} side="top" delay={300}>
                      <span className="truncate block">
                        {task.description || "—"}
                      </span>
                    </Tooltip>
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