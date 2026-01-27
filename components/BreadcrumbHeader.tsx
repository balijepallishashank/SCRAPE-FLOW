"use client";
import { usePathname } from "next/navigation";
import React from "react"; // ✅ fixed
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "./ui/breadcrumb";
import { MobileSidebar } from "./Sidebar";

function BreadcrumbHeader() {
  const pathName = usePathname();
  const paths = pathName === "/" ? [""] : pathName.split("/"); // ✅ kept as-is

  return (
    <div className="flex items-center flex-start">
        <MobileSidebar/>
      <Breadcrumb>
        <BreadcrumbList>
          {paths.map((path,index)=>(
            <React.Fragment key={index}>
                <BreadcrumbItem>
                <BreadcrumbLink className="capitalize" href='/${path}'>

                {path === "" ? "home" : path}
                </BreadcrumbLink>
                </BreadcrumbItem>
            </React.Fragment>


          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

export default BreadcrumbHeader;
