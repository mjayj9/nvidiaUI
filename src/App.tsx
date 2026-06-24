/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser, getRedirectResult } from "firebase/auth";
import { auth } from "./lib/firebase";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Triggering snapshot sync
  useEffect(() => {
    // Capture Google Sign-in redirect result on mount
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          localStorage.removeItem("nim_guest_user");
          setUser(result.user);
        }
      })
      .catch((error: any) => {
        console.error("Redirect login error:", error);
        if (error.code === "auth/unauthorized-domain") {
          const errorMsg = `현재 접속 중인 도메인(${window.location.hostname})이 Firebase Authentication의 승인된 도메인(Authorized Domains)에 등록되지 않았습니다.

[해결 방법]
1. Firebase 콘솔에 로그인합니다.
2. Authentication -> Settings -> Authorized Domains로 이동합니다.
3. '도메인 추가' 버튼을 눌러 '${window.location.hostname}'을 추가해 주세요.`;
          alert(errorMsg);
        }
      });

    const savedGuest = localStorage.getItem("nim_guest_user");
    if (savedGuest) {
      try {
        setUser(JSON.parse(savedGuest));
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem("nim_guest_user");
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        localStorage.removeItem("nim_guest_user");
        setUser(currentUser);
      } else {
        const checkGuest = localStorage.getItem("nim_guest_user");
        if (!checkGuest) {
          setUser(null);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGuestLogin = () => {
    const guestUser = {
      uid: "nvidia-guest-dev",
      email: "developer@nvidia.com",
      displayName: "NVIDIA Developer",
      photoURL: null,
    };
    localStorage.setItem("nim_guest_user", JSON.stringify(guestUser));
    setUser(guestUser);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-neutral-800 rounded-full mb-4"></div>
          <div className="h-4 bg-neutral-800 rounded w-24"></div>
        </div>
      </div>
    );
  }

  return user ? <Dashboard user={user} /> : <Login onGuestLogin={handleGuestLogin} />;
}
