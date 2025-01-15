import Link from 'next/link';
import "./globals.css";
import { MyAppProvider } from "./providers";
import { Metadata } from 'next';
import HeaderBtns from './components/headerbtns';
import {
  nunito_sans,
  poppins,
  rubik_doodle_shadow,
  londrina_outline,
  galindo,
  bungee_spice,
  bungee
} from './utils/fonts';

// import "ag-grid-enterprise";
// import { LicenseManager } from "ag-grid-enterprise";
// const lk: string = process.env.NEXT_PUBLIC_AGGRID_LICENSE_KEY || "";
// LicenseManager.setLicenseKey(lk);

export const metadata: Metadata = {
  title: "Independent Call Auditors",
  description: "Your indispensible customer contact monitor",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className='m-0'>
      <body className={`m-0 ${nunito_sans} ${poppins} ${rubik_doodle_shadow} ${londrina_outline} ${galindo} ${bungee_spice} ${bungee}`}>
        <MyAppProvider>
          <div className='flex flex-col h-screen overflow-hidden'>
            <div className='flex flex-col overflow-hidden flex-1'>
              <header className='flex bg-black h-16 overflow-hidden justify-around items-center'>
                <div className='text-sky-100 text-4xl font-bold'>Independent Call Auditors</div>
                <HeaderBtns />
              </header>
              <div className={`overflow-y-scroll flex-1 bg-teal-50 ${nunito_sans}`}>
                {children}
              </div>
              <footer className="flex bg-black h-16 overflow-hidden justify-around items-center text-sky-100 font-bold">
                <span className="text-sm sm:text-center">© 2025 <a href="https://callauditors.com/" target="_blank" rel="noreferrer noopener" className="hover:underline">Independent Call Auditors, LLC™</a>.&nbsp;&nbsp;All Rights Reserved.
                </span>
                <ul className="flex flex-wrap items-center mt-3 text-sm font-medium sm:mt-0">
                  <li><a href="/about" className="mr-4 hover:underline md:mr-6">About</a></li>
                  <li><a href="/ourprocess" className="mr-4 hover:underline md:mr-6">Our Process</a></li>
                  <li><a href="/ourteam" className="mr-4 hover:underline md:mr-6">Our Team</a></li>
                  <li><a href="/contactus" className="hover:underline">Contact Us</a></li>
                </ul>
              </footer>
            </div>
          </div>
        </MyAppProvider>
      </body>
    </html>
  );
}
