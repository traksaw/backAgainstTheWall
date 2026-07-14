// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react"
import { QuizModal } from "./QuizModal"

// jsdom has no ResizeObserver. Radix's Dialog primitives touch it during
// mount, so without this stub the render throws before assertions run.
if (typeof globalThis.ResizeObserver === "undefined") {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}

const handleQuizAnswer = vi.fn(() => false)
const goBackOne = vi.fn()

const quizState = {
  currentQuestion: 0,
  shuffledQuestions: [
    {
      id: "q1",
      question: "Question 1?",
      options: [
        { id: "a", text: "Option A", archetype: "Realist" },
        { id: "b", text: "Option B", archetype: "Avoider" },
      ],
    },
    {
      id: "q2",
      question: "Question 2?",
      options: [
        { id: "a", text: "Option A", archetype: "Realist" },
        { id: "b", text: "Option B", archetype: "Avoider" },
      ],
    },
  ],
  showWelcome: false,
  answers: {},
  startQuiz: vi.fn(),
  hardReset: vi.fn(),
  handleQuizAnswer,
  goBackOne,
}

vi.mock("@/hooks/useQuizState", () => ({
  useQuizState: () => quizState,
}))

const profile = { _id: "1", email: "jane@example.com", first_name: "Jane", last_name: "Doe" }

afterEach(() => {
  cleanup()
  handleQuizAnswer.mockClear()
  goBackOne.mockClear()
  quizState.currentQuestion = 0
  vi.useRealTimers()
})

describe("QuizModal", () => {
  it("registers exactly one answer when an option is double-clicked rapidly (WAS-27 regression guard)", async () => {
    vi.useFakeTimers()
    render(
      <QuizModal
        open={true}
        onOpenChange={vi.fn()}
        onQuizComplete={vi.fn()}
        profile={profile}
        quizLoading={false}
      />
    )

    const option = screen.getByText("Option A").closest("button") as HTMLButtonElement
    fireEvent.click(option)
    // Fired immediately after the first click, before the 100ms confirmation delay elapses
    fireEvent.click(option)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    expect(handleQuizAnswer).toHaveBeenCalledTimes(1)
  })

  it("re-enables options after a failed completion on the last question, instead of disabling them forever", async () => {
    vi.useFakeTimers()
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {})
    const onQuizComplete = vi.fn().mockImplementation(() => {
      throw new Error("network error")
    })
    handleQuizAnswer.mockReturnValueOnce(true) // this answer completes the quiz

    render(
      <QuizModal
        open={true}
        onOpenChange={vi.fn()}
        onQuizComplete={onQuizComplete}
        profile={profile}
        quizLoading={false}
      />
    )

    const option = screen.getByText("Option A").closest("button") as HTMLButtonElement
    fireEvent.click(option)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    expect(alertSpy).toHaveBeenCalledTimes(1)
    expect(option).not.toBeDisabled()

    // A retry after the failed completion must still reach handleQuizAnswer, not be silently swallowed
    fireEvent.click(option)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })
    expect(handleQuizAnswer).toHaveBeenCalledTimes(2)

    alertSpy.mockRestore()
  })

  it("blocks Back during the pending answer-confirmation delay (would otherwise desync currentQuestion/answers)", async () => {
    vi.useFakeTimers()
    quizState.currentQuestion = 1 // Back is hidden on the first question

    render(
      <QuizModal
        open={true}
        onOpenChange={vi.fn()}
        onQuizComplete={vi.fn()}
        profile={profile}
        quizLoading={false}
      />
    )

    const option = screen.getByText("Option A").closest("button") as HTMLButtonElement
    const backButton = screen.getByRole("button", { name: "Back" })

    fireEvent.click(option)
    // A stale handleQuizAnswer/currentQuestion closure would resume 100ms later and clobber
    // whatever goBackOne just changed, so Back must not fire while a click is pending.
    fireEvent.click(backButton)
    expect(goBackOne).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    expect(handleQuizAnswer).toHaveBeenCalledTimes(1)
  })

  it("does not record an answer or fire onQuizComplete if the dialog is closed during the confirmation delay", async () => {
    vi.useFakeTimers()
    const onQuizComplete = vi.fn()
    handleQuizAnswer.mockReturnValueOnce(true) // would complete the quiz, if it ran

    const { rerender } = render(
      <QuizModal
        open={true}
        onOpenChange={vi.fn()}
        onQuizComplete={onQuizComplete}
        profile={profile}
        quizLoading={false}
      />
    )

    const option = screen.getByText("Option A").closest("button") as HTMLButtonElement
    fireEvent.click(option)

    // User (or an auto-close elsewhere in the app) dismisses the dialog before the 100ms
    // confirmation delay elapses. Radix unmounts DialogContent's subtree but QuizModal itself
    // stays mounted with open=false.
    rerender(
      <QuizModal
        open={false}
        onOpenChange={vi.fn()}
        onQuizComplete={onQuizComplete}
        profile={profile}
        quizLoading={false}
      />
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    expect(handleQuizAnswer).not.toHaveBeenCalled()
    expect(onQuizComplete).not.toHaveBeenCalled()
  })
})
