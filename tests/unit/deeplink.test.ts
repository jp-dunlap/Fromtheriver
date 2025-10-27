/**
 * @jest-environment jsdom
 */
import * as deeplink from "../../src/lib/deeplink";

describe("initArchiveDeepLink", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("does not replace the archive deep link when the slug is missing", () => {
    const updateSpy = jest.spyOn(deeplink, "updateArchiveDeepLink");
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const listener = jest.fn();

    window.history.replaceState(null, "", "http://localhost/archive/");

    const stop = deeplink.initArchiveDeepLink(listener);

    expect(updateSpy).not.toHaveBeenCalled();
    expect(listener).toHaveBeenCalledWith(null);
    expect(warnSpy).toHaveBeenCalled();

    stop();
    warnSpy.mockRestore();
  });
});
