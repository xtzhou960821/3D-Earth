import { Component } from "react";
import type { ReactNode } from "react";
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div className="app-error" role="alert">
          <h1>页面遇到了一点问题</h1>
          <p>请刷新重试。已保存的图层和旅行记录会保留。</p>
          <button className="primary-button" onClick={() => location.reload()}>
            重新打开地球
          </button>
        </div>
      );
    return this.props.children;
  }
}
