import React, {useState} from 'react';
import {Button} from "@/components/atoms/Button.tsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/atoms/Dialog.tsx";
import {PlusCircle, Target} from 'lucide-react';
import {Task} from "@/models/Task.ts";
import TaskForm from "@/components/molecules/TaskForm.tsx";

interface NewTaskDialogProps {
    projectName: string;
    task?: Task;
}

const NewTaskDialog: React.FC<NewTaskDialogProps> = ({projectName, task}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    variant="ghost"
                    className="mt-4 text-xs bg-[#FF5F1F]/20 hover:bg-[#FF5F1F]/30 text-[#FF5F1F] border border-[#FF5F1F]/30 transition-all duration-300 rounded-lg"
                >
                    <PlusCircle size={14} className="mr-1"/>
                    Add Task
                </Button>
            </DialogTrigger>
            <DialogContent
                className="max-w-md bg-gradient-to-br from-black/95 to-black/90 border border-white/10 backdrop-blur-xl overflow-hidden">
                {/* Background effects */}
                <div className="absolute inset-0 bg-[url('/bg-grid.svg')] opacity-5"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF5F1F]/10 rounded-full blur-2xl"></div>

                <div className="relative">
                    <DialogHeader className="mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-[#FF5F1F]/20 border border-[#FF5F1F]/30">
                                <Target className="w-4 h-4 text-[#FF5F1F]"/>
                            </div>
                            <div>
                                <DialogTitle className="text-[#FF5F1F] text-lg font-semibold mt-4">Add Task</DialogTitle>
                                <DialogDescription className="text-white/60 text-sm">
                                    Create a new task for {projectName}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <TaskForm callback={() => setIsOpen(false)}/>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default NewTaskDialog;
