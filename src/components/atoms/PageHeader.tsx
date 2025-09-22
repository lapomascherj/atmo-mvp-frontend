import {Brain} from "lucide-react";
import React from "react";

interface PageHeaderProps {
    title: string;
    subTitle: string;
    icon?: React.ReactNode;
}
const PageHeader: React.FC<PageHeaderProps> = ({title, subTitle, icon}) => {
    return (
        <div className="flex items-center gap-4">
            <div
                className="p-3 rounded-2xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/30">
                {icon || <Brain className="w-7 h-7 text-[#FF7000]"/>}
            </div>
            <div>
                <h1 className="text-4xl font-light text-white mb-2">{title}</h1>
                <p className="text-slate-400">{subTitle}</p>
            </div>
        </div>
    )
}

export default PageHeader
