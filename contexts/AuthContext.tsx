"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type User = {
  id: string;
  email: string;
  name: string;
  lastName?: string | null;
  firstName?: string | null;
  phone?: string | null;
  role?: string | null;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string, lastName?: string, firstName?: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ローカルストレージからユーザー情報を読み込む
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("ユーザー情報の読み込みエラー:", error);
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  // ログインする『ログイン機』
  const login = async (email: string, password: string) => {
    try {
      // ログインAPIにリクエストを送信
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      // レスポンスをJSON形式で解析
      const data = await response.json();

      // レスポンスが成功しなかった場合はエラーを返す
      if (!response.ok) {
        return { success: false, error: data.error || "ログインに失敗しました" };
      }

      // ユーザー情報を設定
      setUser(data.user);
      // ユーザー情報をローカルストレージに保存
      localStorage.setItem("user", JSON.stringify(data.user));
      return { success: true };
    } catch (error) {
      console.error("ログインエラー:", error);
      return { success: false, error: "ログインに失敗しました" };
    }
  };

  // 登録する『登録機』
  const register = async (
    email: string,
    password: string,
    name: string,
    lastName?: string,
    firstName?: string,
    phone?: string
  ) => {
    try {
      // 登録APIにリクエストを送信
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name, lastName, firstName, phone }),
      });

      // レスポンスをJSON形式で解析
      const data = await response.json();
      // レスポンスが成功しなかった場合はエラーを返す
      if (!response.ok) {
        return { success: false, error: data.error || "登録に失敗しました" };
      }

      // ユーザー情報を設定
      setUser(data.user);
      // ユーザー情報をローカルストレージに保存
      localStorage.setItem("user", JSON.stringify(data.user));
      return { success: true };
    } catch (error) {
      console.error("登録エラー:", error);
      return { success: false, error: "登録に失敗しました" };
    }
  };

  // ログアウトする『ログアウト機』
  const logout = () => {
    // ユーザー情報をクリア
    setUser(null);
    // ユーザー情報をローカルストレージから削除
    localStorage.removeItem("user");
  };

  // 認証情報を提供する『認証情報提供機』
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// 認証情報を使用する『認証情報使用機』
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

