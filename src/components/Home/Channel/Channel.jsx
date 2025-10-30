import { Outlet } from "react-router-dom";
import ChatLayout from "./ChatLayout";
import SideBar from "./SideBar";

const Channel = () => {
  return (
    <div className="flex h-full overflow-hidden">
      <SideBar />
      <div className="flex flex-col flex-1 h-full min-w-0">
        <ChatLayout />
      </div>
    </div>

    // <div className="flex h-full">
    //   <SideBar />
    //   <Outlet />
    // </div>
  );
};

export default Channel;
