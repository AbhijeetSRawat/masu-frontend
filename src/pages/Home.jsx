import React from 'react'
import Container from '../components/Container'
import Slider from './Slider'
import Slider2 from './Slider2'
import { FaCheck, FaFileInvoiceDollar, FaLongArrowAltRight, FaUserAlt, FaUsers } from 'react-icons/fa'
import { FaSackDollar, FaTableCellsRowLock } from 'react-icons/fa6'
import { MdOutlinePayment } from 'react-icons/md'
import { IoMdRadio } from 'react-icons/io'
import { ImHeadphones } from 'react-icons/im'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <div>
      <Header/>
      <div className='w-full h-full' style={{ backgroundImage: 'url("/images/2147656717.jpg")', backgroundPosition: 'bottom' }}>
        <Container>
          <div className="w-full mb-5 md:h-100 h-55 items-center grid grid-cols-1 p-2">
            <div><Slider /></div>
          </div>
        </Container>
      </div>
      <div className="w-full">
        <div className="grid bg-gray-200 items-center py-10 h-64 md:grid-cols-3 grid-cols-2 gap-2">
          <div >
            <div className="bg-[#152354] md:w-[50%] w-[80%] rounded-r-full font-semibold text-[20px] md:text-[30px] px-2 text-[#fad98e]">Our Trusted Partners</div>
          </div>
          <div className='md:col-span-2'><Slider2 /></div>
        </div>
      </div>
      <Container>
        <div className="flex py-10 flex-col items-center">
          <h1 className='md:text-[32px] text-[20px] font-semibold'>PLATFORM FEATURES</h1>
          <p className='font-semibold text-center'>Everything you need to create a high-performance culture</p>
        </div>
      </Container>
      <Container>
        <div className="p-5 lg:grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-5">
          <div className="bg-gray-100 p-5 hover:-translate-y-3 duration-500 rounded flex flex-col gap-3 items-center">
            <img width={100} src="/images/core hrms.svg" alt="" />
            <h1 className='text-[18px] font-semibold'>Core HRMS</h1>
            <p className='text-center text-[18px]'>
              Employee management, directory, workflows, self-services, document management
            </p>
            <div className="flex items-center gap-1 font-semibold text-blue-600">
              <div>Explore More</div><FaLongArrowAltRight />
            </div>
          </div>
          <div className="bg-gray-100 p-5 hover:-translate-y-3 duration-500 rounded flex flex-col gap-3 items-center">
            <img width={100} src="/images/attendence.svg" alt="" />
            <h1 className='text-[18px] font-semibold'>Attendance</h1>
            <p className='text-center text-[18px]'>
              Monitor attendance, schedule smart shifts, and make many attendance methods possible.
            </p>
            <div className="flex items-center gap-1 font-semibold text-blue-600">
              <div>Explore More</div><FaLongArrowAltRight />
            </div>
          </div>
          <div className="bg-gray-100 p-5 hover:-translate-y-3 duration-500 rounded flex flex-col gap-3 items-center">
            <img width={100} src="/images/3.svg" alt="" />
            <h1 className='text-[18px] font-semibold'>Leave Management</h1>
            <p className='text-center text-[18px]'>
              Configure every type of leave policy and use leave dashboards and reports for tracking
            </p>
            <div className="flex items-center gap-1 font-semibold text-blue-600">
              <div>Explore More</div><FaLongArrowAltRight />
            </div>
          </div>
          <div className="bg-gray-100 p-5 hover:-translate-y-3 duration-500 rounded flex flex-col gap-3 items-center">
            <img width={100} src="/images/payroll.svg" alt="" />
            <h1 className='text-[18px] font-semibold'>Payroll</h1>
            <p className='text-center text-[18px]'>
              End-to-end payroll processing, taxing, benefits tracking, exemptions, User Payslip.
            </p>
            <div className="flex items-center gap-1 font-semibold text-blue-600">
              <div>Explore More</div><FaLongArrowAltRight />
            </div>
          </div>
          <div className="bg-gray-100 p-5 hover:-translate-y-3 duration-500 rounded flex flex-col gap-3 items-center">
            <img width={100} src="/images/task managment.svg" alt="" />
            <h1 className='text-[18px] font-semibold'>Task Management</h1>
            <p className='text-center text-[18px]'>
              Plan tasks, track and complete them efficiently, delegate task and set reminders
            </p>
            <div className="flex items-center gap-1 font-semibold text-blue-600">
              <div>Explore More</div><FaLongArrowAltRight />
            </div>
          </div>
          <div className="bg-gray-100 p-5 hover:-translate-y-3 duration-500 rounded flex flex-col gap-3 items-center">
            <img width={100} src="/images/performance-managment.svg" alt="" />
            <h1 className='text-[18px] font-semibold'>Performance Management</h1>
            <p className='text-center text-[18px]'>
              Staff evaluations, goal setting, talent management, and ongoing 360-degree feedback.
            </p>
            <div className="flex items-center gap-1 font-semibold text-blue-600">
              <div>Explore More</div><FaLongArrowAltRight />
            </div>
          </div>
          <div className="bg-gray-100 p-5 hover:-translate-y-3 duration-500 rounded flex flex-col gap-3 items-center">
            <img width={100} src="/images/onboarding.svg" alt="" />
            <h1 className='text-[18px] font-semibold'>Onboarding</h1>
            <p className='text-center text-[18px]'>
              Acquire talents, skills, and have a smooth run for employees from day one.
            </p>
            <div className="flex items-center gap-1 font-semibold text-blue-600">
              <div>Explore More</div><FaLongArrowAltRight />
            </div>
          </div>
          <div className="bg-gray-100 p-5 hover:-translate-y-3 duration-500 rounded flex flex-col gap-3 items-center">
            <img width={100} src="/images/task managment.svg" alt="" />
            <h1 className='text-[18px] font-semibold'>Tax & Compliance</h1>
            <p className='text-center text-[18px]'>
              Automated tax calculations, regulatory compliance tracking, and seamless integration to ensure accuracy and legal adherence.
            </p>
            <div className="flex items-center gap-1 font-semibold text-blue-600">
              <div>Explore More</div><FaLongArrowAltRight />
            </div>
          </div>
        </div>
      </Container>
      <Container>
        <div className="w-full grid my-5 md:grid-cols-2 grid-cols-1 gap-5">
          <div className='overflow-hidden'><img width={600} className='object-top' src="/images/project-managers_203633-532.avif" alt="" /></div>
          <div className='space-y-4 p-5'>
            <h1 className='md:text-[28px] font-semibold'>PAYROLL MANAGEMENT</h1>
            <div className='md:text-[18px] font-semibold'>Simplify the complex payroll processes with Masu Consultancy – a powerful, secure, accurate, and fully compliant system! Masu Consultancy ensures quicker processing, precise payouts, and seamless payroll administration. Businesses can avoid financial and legal risks, ensuring employees are paid accurately and on time.</div>
            <div className="flex items-center gap-2">
              <span className='bg-[#152354] text-[#fad98e] p-1 rounded-full'>
                <FaCheck />
              </span>
              <div>Quickly determine payroll calculations and deductions</div>
            </div>
            <div className="flex items-center gap-2">
              <span className='bg-[#152354] text-[#fad98e] p-1 rounded-full'>
                <FaCheck />
              </span>
              <div>Generate accurate Payslips</div>
            </div>
            <div className="flex items-center gap-2">
              <span className='bg-[#152354] text-[#fad98e] p-1 rounded-full'>
                <FaCheck />
              </span>
              <div>Using payroll management to plan future costs</div>
            </div>
            <div className="flex items-center gap-2">
              <span className='bg-[#152354] text-[#fad98e] p-1 rounded-full'>
                <FaCheck />
              </span>
              <div>Secure Data’s and Privacy</div>
            </div>
          </div>
        </div>
      </Container>
      <Container>
        <div className="my-5">
          <div className="flex flex-col items-center gap-5">
            <div><button className='rounded p-2 bg-[#152354] text-[#fad98e] font-semibold cursor-pointer'>How it works</button></div>
            <h1 className='md:text-[28px] font-semibold'>A Step-by-Step Guide to Our Platform</h1>
            <div className='md:text-[18px] text-gray-500 text-center'>Explore our platform with ease! Sign up, select your industry, and seamlessly integrate our tailored payment solutions.</div>
          </div>
        </div>
        <div className="my-5">
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5">
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-[#152354] text-[#fad98e] border-2 border-[#fad98e] flex justify-center items-center font-bold"><FaUserAlt size={25} />+</div>
              <h1 className='md:text-[22px] font-bold'>Create An Account</h1>
              <p className='text-center text-[18px]'>
                Join our platform effortlessly! Streamlined user registration with secure verification.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-[#152354] text-[#fad98e] border-2 border-[#fad98e] flex justify-center items-center font-bold"><FaUsers size={25} /></div>
              <h1 className='md:text-[22px] font-bold'>Add Your Employees</h1>
              <p className='text-center text-[18px]'>
                Add your employees easily and manage their data securely.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-[#152354] text-[#fad98e] border-2 border-[#fad98e] flex justify-center items-center font-bold"><FaSackDollar size={25} /></div>
              <h1 className='md:text-[22px] font-bold'>Run Your First Payroll</h1>
              <p className='text-center text-[18px]'>
                Run your first payroll with our intuitive platform.
              </p>
            </div>
          </div>
        </div>
      </Container>
      <Container>
        <div className="w-full my-5 md:h-64 h-55 items-center grid md:grid-cols-2 grid-cols-1 p-2">
          <div className="space-y-5">
            <h1 className='text-[28px] font-bold text-blue-900'>Take control of all your HR operations and experience the difference!</h1>
            <span className='whitespace-nowrap rounded border-t-3 shadow shadow-white bg-[#152354] text-[#fad98e] px-1 py-2 cursor-pointer'>Get a demo</span>
          </div>
        </div>
        <div className="my-5">
          <div className="flex flex-col items-center gap-5">
            <h1 className='md:text-[28px] font-semibold'>What makes MASU CONSULTANCY better?</h1>
            <div className='md:text-[18px] text-gray-500 text-center'>We offer an array of features designed to assist HR professionals in enhancing employee experiences, streamlining operations, and accelerating company growth</div>
          </div>
        </div>
        <div className="my-5">
          <div className="grid lg:grid-cols-2 md:grid-cols-2 p-5 grid-cols-1 gap-5">
            <div className="flex flex-col gap-5 p-2 shadow rounded">
              <h1 className='md:text-[28px] font-semibold'>Mobile App</h1>
              <div className='md:text-[18px] text-gray-500'>Comes with a feature-rich mobile app to allow the employees full accessibility of their own data.</div>
            </div>
            <div className="flex flex-col gap-5 p-2 shadow rounded">
              <h1 className='md:text-[28px] font-semibold'>Top-notch Security and Privacy</h1>
              <div className='md:text-[18px] text-gray-500'>Ensures watertight security through encryption at rest and SOC Type 2 certified cloud data centres.</div>
            </div>
            <div className="flex flex-col gap-5 p-2 shadow rounded">
              <h1 className='md:text-[28px] font-semibold'>All-In-One Solution</h1>
              <div className='md:text-[18px] text-gray-500'>Offers an integrated HR platform that centralizes all HR data and processes into a single, cohesive system.</div>
            </div>
            <div className="flex flex-col gap-5 p-2 shadow rounded">
              <h1 className='md:text-[28px] font-semibold'>Fully Scalable</h1>
              <div className='md:text-[18px] text-gray-500'>Can be scaled and adjusted to meet unique requirements as we serve customers from small startups to large enterprises.</div>
            </div>
            <div className="flex flex-col gap-5 p-2 shadow rounded">
              <h1 className='md:text-[28px] font-semibold'>Smooth User Experience</h1>
              <div className='md:text-[18px] text-gray-500'>Provides a clean and interactive interface that enhances the user experience</div>
            </div>
          </div>
        </div>
      </Container>
      <Container>
        <div className="my-5 grid lg:grid-cols-4 md:grid-cols-2 p-5 grid-cols-1 gap-3">
          <div className="lg:col-span-2 flex flex-col gap-2">
            <div><button className='rounded p-2 bg-[#152354] text-[#fad98e] font-semibold cursor-pointer'>Integration</button></div>
            <h1 className='md:text-[28px] font-black'>All in One Place <br /> All in Sync.</h1>
            <div className='md:text-[18px] text-gray-500'>Experience seamless coordination with our comprehensive services. From accounting to payroll, we bring everything together in one place,</div>
          </div>
          <div className=" flex flex-col hover:bg-[#152354] duration-500 p-5 hover:text-[#fad98e] bg-blue-100 gap-2">
            <div><button className=' p-2 h-20 w-20 bg-white rounded-full  flex items-center justify-center font-semibold cursor-pointer'><MdOutlinePayment size={25} /></button></div>
            <h1 className='md:text-[28px] font-semibold p-3  text-center'> Payment Gateways</h1>
          </div>
          <div className=" flex flex-col hover:bg-[#152354] duration-500 p-5 hover:text-[#fad98e] gap-2">
            <div><button className=' p-2 h-20 w-20 bg-white rounded-full  flex items-center justify-center font-semibold cursor-pointer'><FaFileInvoiceDollar size={25} /></button></div>
            <h1 className='md:text-[28px] font-semibold p-3 text-center'>Tax Software <br /> Integration</h1>
          </div>
          <div className=" flex flex-col hover:bg-[#152354] duration-500 p-5 hover:text-[#fad98e] bg-blue-100 gap-2">
            <div><button className=' p-2 h-20 w-20 bg-white rounded-full  flex items-center justify-center font-semibold cursor-pointer'><IoMdRadio size={25} /></button></div>
            <h1 className='md:text-[28px] font-semibold p-3 text-center'>Expense Management</h1>
          </div>
          <div className=" flex flex-col hover:bg-[#152354] duration-500 p-5 hover:text-[#fad98e]  gap-2">
            <div><button className=' p-2 h-20 w-20 bg-white rounded-full  flex items-center justify-center font-semibold cursor-pointer'><FaTableCellsRowLock size={25} /></button></div>
            <h1 className='md:text-[28px] font-semibold p-3 text-center'>Time Tracking Systems</h1>
          </div>
          <div className=" flex flex-col hover:bg-[#152354] duration-500 p-5 hover:text-[#fad98e] bg-blue-100 gap-2">
            <div><button className=' p-2 h-20 w-20 bg-white rounded-full  flex items-center justify-center font-semibold cursor-pointer'><ImHeadphones size={25} /></button></div>
            <h1 className='md:text-[28px] font-semibold p-3 text-center'>Customer Relationship</h1>
          </div>
        </div>
      </Container>

      <Footer/>
    </div>
  )
}
