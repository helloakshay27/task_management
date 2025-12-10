import { Outlet } from 'react-router-dom';
import SideBar from './SideBar';

const Channel = () => {
  return (
    <div className="flex h-full">
      <SideBar />
      <Outlet />
    </div>
  );
};

export default Channel;
