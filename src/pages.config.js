import Dashboard from './pages/Dashboard';
import DesignSystem from './pages/DesignSystem';
import Settings from './pages/Settings';
import Home from './pages/Home';
import BrainDump from './pages/BrainDump';
import Meds from './pages/Meds';
import Logs from './pages/Logs';
import Ideas from './pages/Ideas';
import Commissions from './pages/Commissions';
import Brand from './pages/Brand';
import Admin from './pages/Admin';
import Tasklist from './pages/Tasklist';
import Veri from './pages/Veri';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "DesignSystem": DesignSystem,
    "Settings": Settings,
    "Home": Home,
    "BrainDump": BrainDump,
    "Meds": Meds,
    "Logs": Logs,
    "Ideas": Ideas,
    "Commissions": Commissions,
    "Brand": Brand,
    "Admin": Admin,
    "Tasklist": Tasklist,
    "Veri": Veri,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};