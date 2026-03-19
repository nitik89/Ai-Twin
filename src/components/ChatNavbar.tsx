"use client";

import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export default function ChatNavbar() {
  const { data: session } = useSession();

  return (
    <header className="flex items-center justify-between border-b border-gray-800 px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold">
          AT
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">AI Twin</span>
          <span className="text-xs text-gray-400">learning about you</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-xs font-medium text-emerald-400">online</span>
        </div>

        <Link
          href="/discover"
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Discover
        </Link>
        <Link
          href="/friends"
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Friends
        </Link>
        <Link
          href="/mirror"
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Mirror
        </Link>

        <div className="flex items-center gap-2">
          {session?.user?.image && (
            <Image
              src={session.user.image}
              alt="avatar"
              width={28}
              height={28}
              className="rounded-full"
            />
          )}
          <span className="text-xs text-gray-300">
            {session?.user?.name?.split(" ")[0]}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
