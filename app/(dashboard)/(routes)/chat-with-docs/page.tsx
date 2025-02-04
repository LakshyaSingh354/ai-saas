"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChatCompletionRequestMessage } from "openai";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { BotAvatar } from "@/components/bot-avatar";
import { Empty } from "@/components/empty";
import { Heading } from "@/components/heading";
import { Loader } from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";

import useProModal from "@/hooks/use-pro-modal";
import { toast } from "react-hot-toast";
import { formSchema } from "./constants";
import ReactMarkdown from "react-markdown";

const ConversationPage = () => {
	const router = useRouter();
	const proModal = useProModal();
	const [messages, setMessages] = useState<ChatCompletionRequestMessage[]>(
		[]
	);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			prompt: "",
		},
	});

	const isLoading = form.formState.isSubmitting;

	// const onSubmit = async (values: z.infer<typeof formSchema>) => {
	// 	console.log(values);
	// 	try {
	// 		const userMessage: ChatCompletionRequestMessage = {
	// 			role: "user",
	// 			content: values.prompt,
	// 		};
	// 		const newMessages = [...messages, userMessage];

	// 		const response = await axios.post("/api/conversation", {
	// 			messages: newMessages,
	// 		});

	// 		setMessages((current) => [...current, userMessage, response.data]);
	// 		form.reset();
	// 	} catch (error: any) {
	// 		console.log(error);
	// 		if (error?.response?.status === 403) {
	// 			proModal.onOpen();
	// 		} else {
	// 			toast.error("Something went wrong.");
	// 		}
	// 	} finally {
	// 		router.refresh();
	// 	}
	// };
	const handleFileUpload = async (e: { target: { files: any } }) => {
		const selectedFiles = e.target.files;
		if (selectedFiles && selectedFiles.length > 0) {
			const formData = new FormData();
			for (let i = 0; i < selectedFiles.length; i++) {
				formData.append("files", selectedFiles[i]);
			}
			try {
				const response = await fetch(
					"http://localhost:8000/upload-files",
					{
						method: "POST",
						body: formData,
					}
				);

				if (!response.ok) {
					throw new Error("Failed to upload files");
				}
				const data = await response.json();
				toast.success("Files uploaded successfully:", data);
			} catch (error) {
				toast.error("Error uploading files:");
			}
		}
	};

	const onSubmit = async (data: { prompt: any }) => {
		try {
			const userMessage: ChatCompletionRequestMessage = {
				role: "user",
				content: data.prompt,
			};
			const newMessages = [...messages, userMessage];
			const response = await fetch("http://localhost:8000/query", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ question: newMessages }),
			});
			if (!response.ok) {
				const errorData = await response.json();
        toast.error(`Error: ${errorData.detail}`);
        return;
			}
			const result = await response.json();
      const assistantMessage: ChatCompletionRequestMessage = {
        role: "assistant",
        content: result.response,
      };
			setMessages((current) => [...current, userMessage, assistantMessage]);
			form.reset();
			console.log("API response:", result.response);
		} catch (error) {
			if (error instanceof Error) {
				console.log(`Error: ${error.message}`);
			} else {
				console.log(`Unexpected error: ${error}`);
			}
		} finally {
			router.refresh();
		}
	};

	return (
		<div>
			<Heading
				title="Chat With Docs"
				description="Upload files and start a conversation with the AI assistant."
				icon={MessageSquare}
				iconColor="text-violet-500"
				bgColor="bg-violet-500/10"
			/>
			<div className="px-4 lg:px-8">
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="rounded-lg border w-full p-4 px-3 md:px-6 focus-within:shadow-sm grid grid-cols-12 gap-2"
					>
						<FormField
							name="files"
							render={({ field }) => (
								<FormItem className="col-span-12 lg:col-span-10">
									<FormControl className="m-0 p-0">
										<input
											type="file"
											{...field}
											onChange={handleFileUpload}
											multiple
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							name="prompt"
							render={({ field }) => (
								<FormItem className="col-span-12 lg:col-span-10">
									<FormControl className="m-0 p-0">
										<Input
											{...field}
											placeholder="Start typing here..."
											className="border-0 outline-none focus-visible:ring-0 focus-visible:ring-transparent"
											disabled={isLoading}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<Button
							className="col-span-12 lg:col-span-2 w-full"
							disabled={isLoading}
						>
							Generate
						</Button>
					</form>
				</Form>
				<div className="space-y-4 mt-4">
					{isLoading && (
						<div className="p-8 rounded-lg w-full flex items-center justify-center bg-muted">
							<Loader />
						</div>
					)}
					{messages.length === 0 && !isLoading && (
						<Empty label="Upload files and have a conversation." />
					)}
					<div className="flex flex-col-reverse gap-y-4">
						{messages.map((message, index) => (
							<div
								key={index}
								className={cn(
									"p-8 w-full flex items-start gap-x-8 rounded-lg",
									message.role === "user"
										? "bg-white border border-black/10"
										: "bg-muted"
								)}
							>
								{message.role === "user" ? (
									<UserAvatar />
								) : (
									<BotAvatar />
								)}
								<p className="text-sm"><ReactMarkdown>{String(message.content)}</ReactMarkdown></p>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};
export default ConversationPage;
