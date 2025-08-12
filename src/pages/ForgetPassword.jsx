import React, { useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { endpoints } from '../services/api'
import { apiConnector } from '../services/apiConnector';
import toast from 'react-hot-toast';

const {FORGET_PASSWORD} = endpoints;

const ForgetPassword = () => {

    const [email,setEmail] = useState('');

    const [loading,setLoading] = useState(false);

    const changeHandler = (e)=>{
        setEmail(e.target.value)
    }

    const submitHandler = async () =>{
        try{
            setLoading(true);
            const data = await apiConnector("POST",FORGET_PASSWORD,{email});
            console.log(data);
            toast.success("Link has been sent to your email");
            setEmail("");
        }catch(error){
            console.log(error)
            toast.error("Unable to sent the link")
        }finally{
            setLoading(false)
        }
    }

  return (
    <div className="flex flex-col ">
       <Header />
        <div className='flex flex-col items-center my-[30vh] '>
            <div className='bg-blue-950 h-[35vh] w-[70vw] flex flex-col  lg:w-[41vw] rounded-3xl p-10 shadow-2xl'>

        <label htmlFor='email' className='text-white text-2xl'>
            Enter your email here:
        </label>
        
         <input
              onChange={changeHandler}
              type="text"
              name="email"
              value={email}
              placeholder="eg.abc@gmail.com"
              className="w-[70vw] shadow-xl h-[5vh] p-2 mt-2 rounded-xl bg-white text-blue-950 placeholder-blue-950 lg:w-[35vw] lg:h-[7vh]"
            />

            <button className='h-[6vh] w-[7vw] bg-blue-500 mx-auto mt-4 flex justify-center items-center rounded-xl text-white' onClick={submitHandler}>
                 {loading ? <div className="loader1"></div> : <>Send Email</>}
            </button>
        </div>
        </div>
        

       <Footer />
    </div>
  )
}

export default ForgetPassword
