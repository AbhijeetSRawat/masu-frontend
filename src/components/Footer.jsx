import React from 'react'
import Container from './Container'
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaPhoneAlt, FaTwitter } from 'react-icons/fa'
import { MdLocationPin, MdOutlineEmail } from 'react-icons/md'

export default function Footer() {
  return (
    <div className='bg-[#152354] '>
      <Container>
        <div className="grid text-white p-3 lg:grid-cols-4 md:grid-cols-3 grid-cols-1">
          <div className='md:block hidden'><img width={200} src="/images/logo.jpeg" alt="" /></div>
          <div>
            <div className='my-2'><strong>Quick Links</strong></div>
            <div className="space-y-1 ">
              <div><span className='hover:border-b cursor-pointer'>Home</span></div>
              <div><span className='hover:border-b cursor-pointer'>Why Us</span></div>
              <div><span className='hover:border-b cursor-pointer'>Solutions</span></div>
              <div><span className='hover:border-b cursor-pointer'>Features</span></div>
              {/* <div><span className='hover:border-b cursor-pointer'>Resources</span></div> */}
            </div>
          </div>
          <div>
            <div className='my-2'><strong>Follow Us</strong></div>
            <div className="flex items-center gap-2">
              <FaFacebookF size={20} />
              <FaTwitter size={20} />
              <FaLinkedinIn size={20} />
              <FaInstagram size={20} />
            </div>
          </div>
          <div>
            <div className='my-2'><strong>Newsletter</strong></div>
            <div className="space-y-3">
              <div><p>Subscribe to our newsletter to get the latest updates.</p></div>
              <div><input type="text" className='outline-none p-2 bg-white w-[70%] text-black rounded' placeholder='Your Email' /></div>
              <div><button className='p-2 bg-blue-600 cursor-pointer rounded text-white w-[70%]'>Subscribe</button></div>
            </div>
          </div>
          <div>
            <div className='my-2'><strong>Contact Us</strong></div>
            <div className="space-y-1 ">
              <div className='flex items-center gap-2'><FaPhoneAlt /><span className='hover:border-b cursor-pointer'> +1 234 567 890</span></div>
              <div className='flex items-center gap-2'><MdOutlineEmail /><span className='hover:border-b cursor-pointer'> support@payrollapp.com</span></div>
              <div className='flex items-center gap-2'><MdLocationPin /><span className='hover:border-b cursor-pointer'>123 Payroll St, Suite 100, City, <br /> Country</span></div>

            </div >
          </div >
          <div>
            <div className='my-2'><strong>Company</strong></div>
            <div className="space-y-1 ">
              <div><span className='hover:border-b cursor-pointer'>About Us</span></div>
              <div><span className='hover:border-b cursor-pointer'>Careers</span></div>
              <div><span className='hover:border-b cursor-pointer'>Press</span></div>
              <div><span className='hover:border-b cursor-pointer'>Contact</span></div>
              <div><span className='hover:border-b cursor-pointer'>Privacy Policy</span></div>
            </div>
          </div>
          <div>
            <div className='my-2'><strong>Customer Support</strong></div>
            <div className="space-y-1 ">
              <div><span className='hover:border-b cursor-pointer'>Help Center</span></div>
              <div><span className='hover:border-b cursor-pointer'>Community</span></div>
              <div><span className='hover:border-b cursor-pointer'>Support Tickets</span></div>
              <div><span className='hover:border-b cursor-pointer'>Knowledge Base</span></div>
            </div>
          </div>
        </div >
      </Container >
      <hr className='border-t my-2  border-white' />
      <h1 className='font-semibold pt-2 pb-5 text-center text-white md:text-[22px]'>2025 © All rights reserved. MASU</h1>
    </div >
  )
}
