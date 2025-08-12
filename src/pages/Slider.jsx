import React, { useEffect, useState } from 'react'

export default function Slider() {
    const [open, setOpen] = useState(0);
    const content = [
        {
            title: "Best Payroll Software for Businesses",
            name: 'Designed for startups, SMBs, and enterprises.',
            btn: 'Try Free'
        },
        {
            title: "Effortless Payroll Management",
            name: 'Automate salaries, compliance & employee benefits easily.',
            btn: 'Get Started'
        },
        {
            title: "Save Time & Reduce Errors",
            name: 'Handle payroll processing with 100% accuracy.',
            btn: 'Learn More'
        }
    ];
    useEffect(() => {
        const interval = setInterval(() => { setOpen((anuj) => (anuj == content.length - 1 ? 0 : anuj + 1)) }, 2000)
        return () => clearInterval(interval)
    }, [])
    const { title, name, btn } = content[open]
    return (
        <>
            <div className="space-y-5">
                <h1 className='md:text-[35px] font-bold text-white text-center'>{title}</h1>
                <div className='text-white text-center md:text-[18px]'>{name}</div>
                <div className="text-center"><span className='whitespace-nowrap  rounded border-t-3 shadow shadow-white bg-[#152354] text-[#fad98e] px-1 py-2 cursor-pointer'>{btn}</span></div>
            </div>
        </>
    )
}
