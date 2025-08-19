import React, { useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { endpoints } from '../services/api'
import { apiConnector } from '../services/apiConnector';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

const {RESET_PASSWORD} = endpoints;

const ResetPassword = () => {

    const [password,setPassword] = useState('');
    const [confirmPassword,setConfirmPassword] = useState('');

    const [loading,setLoading] = useState(false);

    const changeHandler = (e)=>{
        setPassword(e.target.value)
    }

    const changeCHandler = (e)=>{
        setConfirmPassword(e.target.value)
    }

    const location = useLocation();

    const token = location.pathname.split("/").at(-1)

    const submitHandler = async () =>{
        try{
            setLoading(true);
            if(password !== confirmPassword){
                toast.error("Passwords did not match...")
                return
            }
            const data = await apiConnector("POST",RESET_PASSWORD + token,{password});
            console.log(data);
            toast.success("Your password has been reset!");
            setPassword('');
            setConfirmPassword('');
        }catch(error){
            console.log(error)
            toast.error("Unable to reset your password!")
        }finally{
            setLoading(false)
        }
    }

  return (
    <div className="flex flex-col ">
       <Header />
       
        <div className='flex flex-col items-center my-[30vh] '>
            <div className='bg-blue-950 min-h-[40vh] w-[70vw] flex flex-col  lg:w-[41vw] rounded-3xl p-10 shadow-2xl'>

        <label htmlFor='password' className='text-white text-2xl'>
            Enter your new password here:
        </label>
        
         <input
              onChange={changeHandler}
              type="password"
              name="password"
              value={password}
              placeholder="Enter you new password here"
              className="w-[70vw] shadow-xl h-[5vh] p-2 mt-2 rounded-xl bg-white text-blue-950 placeholder-blue-950 lg:w-[35vw] lg:h-[7vh]"
            />

             <label htmlFor='confirmPassword' className='text-white text-2xl mt-4'>
            Confirm your password here:
        </label>
        
         <input
              onChange={changeCHandler}
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              placeholder="Confirm you new password here"
              className="w-[70vw] shadow-xl h-[5vh] p-2 mt-2 rounded-xl bg-white text-blue-950 placeholder-blue-950 lg:w-[35vw] lg:h-[7vh]"
            />

            <button className='h-[6vh] w-[9vw] bg-blue-500 mx-auto mt-4 flex justify-center items-center rounded-xl text-white' onClick={submitHandler}>
                 {loading ? <div className="loader1"></div> : <>Set Password</>}
            </button>
        </div>
        </div>
        

       <Footer />
    </div>
  )
}

export default ResetPassword