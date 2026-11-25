"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

const ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY ?? "";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Status = "idle" | "sending" | "success" | "error" | "offline";
type FieldName = "name" | "email" | "message";
type Errors = Partial<Record<FieldName, string>>;

type Values = {
  name: string;
  email: string;
  project: string;
  message: string;
  botcheck: string;
};

const EMPTY: Values = {
  name: "",
  email: "",
  project: "",
  message: "",
  botcheck: "",
};

function validate(values: Values): Errors {
  const errors: Errors = {};

  if (!values.name.trim()) {
    errors.name = "Please add your name.";
  }

  if (!values.email.trim()) {
    errors.email = "Please add your email address.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "That email address doesn't look right.";
  }

  if (values.message.trim().length < 10) {
    errors.message = "Please write at least 10 characters.";
  }

  return errors;
}

export function ContactForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "success") {
      successRef.current?.focus();
    }
  }, [status]);

  const update = (field: keyof Values, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));

    if (field === "name" || field === "email" || field === "message") {
      setErrors((current) => {
        if (!current[field]) return current;
        const next = { ...current };
        delete next[field];
        return next;
      });
    }

    if (status === "error" || status === "offline") {
      setStatus("idle");
      setStatusMessage("");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;

    const nextErrors = validate(values);
    setErrors(nextErrors);

    const firstInvalid = nextErrors.name
      ? nameRef
      : nextErrors.email
        ? emailRef
        : nextErrors.message
          ? messageRef
          : null;

    if (firstInvalid) {
      firstInvalid.current?.focus();
      return;
    }

    // Honeypot: a bot filled the hidden input. Pretend it worked.
    if (values.botcheck) {
      setValues(EMPTY);
      setStatus("success");
      return;
    }

    if (!ACCESS_KEY) {
      setStatus("offline");
      setStatusMessage(
        "This form isn't connected yet. Email vamsisanoj04@gmail.com and I'll reply within 24 hours.",
      );
      return;
    }

    setStatus("sending");
    setStatusMessage("");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          name: values.name.trim(),
          email: values.email.trim(),
          project: values.project.trim(),
          message: values.message.trim(),
          from_name: "Sanoj portfolio",
          replyto: values.email.trim(),
          subject: "New message from your portfolio",
          botcheck: "",
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
      } | null;

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || "The message couldn't be sent. Please try again.",
        );
      }

      setValues(EMPTY);
      setErrors({});
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setStatusMessage(
        error instanceof Error && error.message
          ? error.message
          : "Something went wrong sending that. Please try again.",
      );
    }
  };

  if (status === "success") {
    return (
      <div
        className="contact-success"
        ref={successRef}
        tabIndex={-1}
        role="status"
      >
        <p className="contact-tag">[ TRANSMISSION_COMPLETE ]</p>
        <p className="contact-success__title">MESSAGE RECEIVED</p>
        <p className="contact-success__copy">
          Thanks — your message is in. I usually reply within 24 hours, so keep
          an eye on your inbox.
        </p>
        <button
          type="button"
          className="contact-success__again"
          onClick={() => setStatus("idle")}
        >
          SEND ANOTHER <span aria-hidden="true">↗</span>
        </button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="contact-grid">
        <div className="contact-field">
          <label className="contact-label" htmlFor="contact-name">
            <span aria-hidden="true">01</span> YOUR NAME
          </label>
          <input
            id="contact-name"
            ref={nameRef}
            className="contact-input"
            type="text"
            name="name"
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="Your name"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
          />
          {errors.name && (
            <p className="contact-error" id="contact-name-error" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        <div className="contact-field">
          <label className="contact-label" htmlFor="contact-email">
            <span aria-hidden="true">02</span> EMAIL ADDRESS
          </label>
          <input
            id="contact-email"
            ref={emailRef}
            className="contact-input"
            type="email"
            name="email"
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
          />
          {errors.email && (
            <p className="contact-error" id="contact-email-error" role="alert">
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="contact-field contact-field--full">
        <label className="contact-label" htmlFor="contact-project">
          <span aria-hidden="true">03</span> WHAT ARE YOU BUILDING
        </label>
        <input
          id="contact-project"
          className="contact-input"
          type="text"
          name="project"
          value={values.project}
          onChange={(event) => update("project", event.target.value)}
          placeholder="A web app, a site, a fix"
        />
      </div>

      <div className="contact-field contact-field--full">
        <label className="contact-label" htmlFor="contact-message">
          <span aria-hidden="true">04</span> MESSAGE
        </label>
        <textarea
          id="contact-message"
          ref={messageRef}
          className="contact-input contact-textarea"
          name="message"
          value={values.message}
          onChange={(event) => update("message", event.target.value)}
          placeholder="What you have in mind, timeline, anything useful."
          rows={4}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={
            errors.message ? "contact-message-error" : undefined
          }
        />
        {errors.message && (
          <p className="contact-error" id="contact-message-error" role="alert">
            {errors.message}
          </p>
        )}
      </div>

      {status === "error" && (
        <p className="contact-status" role="alert">
          {statusMessage} You can also email{" "}
          <a href="mailto:vamsisanoj04@gmail.com">vamsisanoj04@gmail.com</a>.
        </p>
      )}

      {status === "offline" && (
        <p className="contact-status contact-status--info" role="alert">
          {statusMessage}
        </p>
      )}

      <div className="contact-actions">
        <button
          type="submit"
          className="contact-submit"
          disabled={status === "sending"}
        >
          {status === "sending" ? (
            <>
              SENDING
              <span className="contact-dots" aria-hidden="true">
                <i>.</i>
                <i>.</i>
                <i>.</i>
              </span>
            </>
          ) : (
            <>
              SEND MESSAGE <span aria-hidden="true">→</span>
            </>
          )}
        </button>
        <p className="contact-actions__note">
          NO SPAM · JUST A REPLY FROM ME
        </p>
      </div>

      {/* Honeypot: hidden from people, irresistible to bots. */}
      <input
        type="text"
        name="botcheck"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="contact-hp"
        value={values.botcheck}
        onChange={(event) => update("botcheck", event.target.value)}
      />
    </form>
  );
}
