import React from 'react';
import {Route, Routes} from "react-router-dom";
import Homepage from "./components/Homepage";
import SignIn from "./components/register/SignIn";
import SignUp from "./components/register/SignUp";
// OTP VERIFICATION DISABLED
// import OtpRegistration from "./components/otp/OtpRegistration";
// import OtpVerification from "./components/otp/OtpVerification";
import ProfileSetup from "./components/profile/ProfileSetup";

function App() {
    return (
        <div>
            <Routes>
                <Route path="/" element={<Homepage/>}/>
                <Route path='/signin' element={<SignIn/>}/>
                <Route path='/signup' element={<SignUp/>}/>
                {/* OTP VERIFICATION DISABLED */}
                {/* <Route path='/otp-register' element={<OtpRegistration/>}/> */}
                {/* <Route path='/otp-verify' element={<OtpVerification/>}/> */}
                <Route path='/profile-setup' element={<ProfileSetup/>}/>
            </Routes>
        </div>
    );
}

export default App;
