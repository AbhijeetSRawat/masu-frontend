import { Route, Routes } from "react-router-dom";
import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";
import RegisterCompany from "./pages/RegisterCompany";

import CompanyList from "./pages/CompanyList";
import AdminPanel from "./pages/AdminPanel";
import ShiftManagement from "./pages/ShiftManagement";
import AddManager from "./pages/AddManager";
import AddDepartment from "./pages/AddDepartment";
import { useSelector } from "react-redux";
import PrivateRoute from "./components/core/PrivateRoute";
import AddEmployee from "./pages/AddEmployee";
import Home from "./pages/Home";
import Footer from "./components/Footer";
import Demo from "./pages/Demo";
import Contactus from "./pages/Contactus";
import Policies from "./pages/Policies";
import ForgetPassword from "./pages/ForgetPassword";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";
import EmployeeSidebar from "./components/EmployeeSidebar";
import EmployeePanel from "./pages/EmployeePanel";
import AddLeave from "./pages/AddLeave";
import LeaveApproval from "./pages/LeaveApproval";
import Reimbursements from "./pages/Reimbursements";
import ReimbursementReport from "./pages/ReimbursementReport";
import ReimbursementCategory from "./pages/ReimbursementCategory";
import CustomizeTableSequence from "./pages/CustomizeTableSequence";
import WhyUs from "./pages/WhyUs";
import { ForSmallBusiness } from "./pages/ForSmallBusiness";
import { ForEnterprises } from "./pages/ForEnterprises";
import { ForHRTeams } from "./pages/ForHRTeams";
import PayrollProcessing from "./pages/PayrollProcessing";
import TaxCompliance from "./pages/TaxCompliance";
import EmployeeProfile from "./pages/EmployeeProfile";
import LeavePolicy from "./pages/LeavePolicy";
import EmployeeMasterInformation from "./pages/EmployeeMasterInformation";
import EmployeePolicy from "./pages/EmployeePolicy";
import LeaveBalance from "./pages/LeaveBalance";
import AdminLeaveBalance from "./pages/AdminLeaveBalance";
import CompanyHolidays from "./pages/CompanyHolidays";
import EmployeeMasterReport from "./pages/EmployeeMasterReport";
import AddNewJoiners from "./pages/AddNewJoiners";
import UploadDocuments from "./pages/UploadDocuments";

function App() {
  const role = useSelector((state) => state.auth.role);

  return (
    <>
      <div className="lg:overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Home/>}/>
    
          <Route path="/login" element={<Login />} />
          <Route path="/demo" element={<Demo/>}/>
          <Route path="/contactus" element={<Contactus/>}/>
          <Route path="/forgetpassword" element={<ForgetPassword/>}/>
          <Route path="/reset-password/:tokenId" element={<ResetPassword/>}/>
          <Route path="whyus" element={<WhyUs/>}/>
          <Route path="/forsmallbusiness" element={<ForSmallBusiness/>}/>
          <Route path="/forenterprises" element={<ForEnterprises/>}/>
          <Route path="/forhrteams" element={<ForHRTeams/>}/>
          <Route path="/payrollprocessing" element={<PayrollProcessing/>}/>
          <Route path="/taxcompliance" element={<TaxCompliance/>}/>

          {/* for this a protected route is to be designed */}
          <Route path="/changepassword" element={<ChangePassword/>}/>
          <Route path="/employeepanel" element={<EmployeePanel/>}/>
          <Route path="/employeeprofile" element={<EmployeeProfile/>}/>
          <Route path="/addleave" element={<AddLeave />}/>
          <Route path="/reimbursements" element={<Reimbursements/>}/>
          <Route path="/employeepolicy" element={<EmployeePolicy/>}/>
          <Route path="/leavebalance" element={<LeaveBalance/>}/>

          <Route path="/uploaddocuments" element={<UploadDocuments/>}/>


          {role === "superadmin" && (
            <>
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    {" "}
                    <Dashboard />{" "}
                  </PrivateRoute>
                }
              />
              <Route
                path="/companylist"
                element={
                  <PrivateRoute>
                    {" "}
                    <CompanyList />{" "}
                  </PrivateRoute>
                }
              />
            </>
          )}

          {["superadmin", "admin"].includes(role) && (
            <>
              <Route path="/registercompany" element={ <PrivateRoute> <RegisterCompany /> </PrivateRoute> } />
            <Route path="/leaveapproval" element={ <PrivateRoute> <LeaveApproval /> </PrivateRoute>  }/>
          <Route path="/adminpanel" element={ <PrivateRoute> <AdminPanel /> </PrivateRoute> } />
          <Route path="/shiftmanagement" element={ <PrivateRoute> <ShiftManagement /> </PrivateRoute> } />
          <Route path="/addmanager" element={ <PrivateRoute> <AddManager /> </PrivateRoute> } />
          <Route path="/adddepartment" element={ <PrivateRoute> <AddDepartment /> </PrivateRoute> } />
          <Route path="/addemployee" element={<PrivateRoute> <AddEmployee/> </PrivateRoute>}/>
          <Route path="/policies" element = {<PrivateRoute> <Policies/> </PrivateRoute>}/>
          <Route path="/reimbursementreport" element={<PrivateRoute> <ReimbursementReport/> </PrivateRoute>}/>
          <Route path="/reimbursementcategory" element={<PrivateRoute> <ReimbursementCategory/> </PrivateRoute>}/>
          <Route path="/customizetablesequence" element={<PrivateRoute><CustomizeTableSequence/></PrivateRoute>}/>
          <Route path="/addleavepolicy" element={<PrivateRoute><LeavePolicy/></PrivateRoute>}/>
          <Route path="/employeemasterinformation" element={<PrivateRoute><EmployeeMasterInformation/></PrivateRoute>}/>
          <Route path="/adminleavebalance" element={<PrivateRoute><AdminLeaveBalance/></PrivateRoute>}/>
          <Route path="/companyholidays" element={<PrivateRoute><CompanyHolidays/></PrivateRoute>}/>
          <Route path="/employeemasterreport" element={<PrivateRoute><EmployeeMasterReport/></PrivateRoute>}/>
          <Route path="/newjoinersform" element={<PrivateRoute><AddNewJoiners/></PrivateRoute>}/>
            </>
          )}

          
          <Route path="*" element={<>{role}</>} />
        </Routes>
        
      </div>
    </>
  );
}

export default App;
