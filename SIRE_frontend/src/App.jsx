/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-21
 * Description: Root application component.
 * Serves as the main entry point for rendering the application's routing structure 
 * and global styles.
 */

import AppRouter from "./navigation/AppRouter";
import './App.css'

/** Function that returns the App component for rendering the application's routing system. */
export default function App() {
  return <AppRouter />
}
