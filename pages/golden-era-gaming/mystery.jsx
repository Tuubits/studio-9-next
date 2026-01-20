import React, { useState } from 'react';
import Image from 'next/image';
import Head from 'next/head';
import Link from 'next/link';

export default function MysteryRoomChallenge() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData).toString(),
    })
      .then(() => setSubmitted(true))
      .catch((error) => console.error('Form submission error:', error));
  };

  return (
    <>
      <Head>
        <title>Mystery Room Challenge | Golden Era Gaming</title>
      </Head>
      <div className="min-h-screen bg-black text-amber-400 px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <Link href="/golden-era-gaming" className="text-amber-400 hover:text-amber-300 underline">
              &larr; Back to Golden Era Gaming
            </Link>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-8 text-amber-400">
            MYSTERY ROOM CHALLENGE:<br />
            <span className="text-amber-300">Hidden Pledge Level Access</span>
          </h1>

          <p className="text-lg sm:text-xl text-center mb-12 text-amber-200 max-w-2xl mx-auto">
            If you can name the location of the two Castle Whiterock rooms pictured below,
            you will gain access to a hidden pledge level with special options!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
            <div className="relative aspect-square w-full">
              <Image
                src="/MysteryRoom_Part1.png"
                alt="Mystery Room 1"
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-contain rounded-lg border-2 border-amber-400"
              />
            </div>
            <div className="relative aspect-square w-full">
              <Image
                src="/MysteryRoom_Part2.png"
                alt="Mystery Room 2"
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-contain rounded-lg border-2 border-amber-400"
              />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-semibold text-center mb-6 text-amber-400">
            Where are these two images from in Castle Whiterock?
          </h2>

          {submitted ? (
            <div className="text-center p-8 border-2 border-amber-400 rounded-lg">
              <p className="text-2xl text-amber-300 font-semibold">Thank you for your submission!</p>
              <p className="text-amber-200 mt-2">We&apos;ll review your answer and get back to you.</p>
            </div>
          ) : (
            <form
              name="mystery-room-challenge"
              method="POST"
              data-netlify="true"
              netlify-honeypot="bot-field"
              onSubmit={handleSubmit}
              className="max-w-xl mx-auto space-y-6"
            >
              <input type="hidden" name="form-name" value="mystery-room-challenge" />
              <p className="hidden">
                <label>
                  Don&apos;t fill this out if you&apos;re human: <input name="bot-field" />
                </label>
              </p>

              <div>
                <label htmlFor="answer" className="block text-amber-400 font-medium mb-2">
                  Your Answer
                </label>
                <input
                  type="text"
                  id="answer"
                  name="answer"
                  maxLength={100}
                  required
                  placeholder="Enter the location of the two rooms..."
                  className="w-full px-4 py-3 rounded-lg bg-white text-black placeholder-gray-500 border-2 border-amber-400 focus:outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-300"
                />
                <p className="text-amber-200 text-sm mt-1">Maximum 100 characters</p>
              </div>

              <div>
                <label htmlFor="email" className="block text-amber-400 font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-lg bg-white text-black placeholder-gray-500 border-2 border-amber-400 focus:outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-300"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 px-6 bg-amber-400 hover:bg-amber-300 text-black font-bold text-lg rounded-lg transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-amber-300"
              >
                Submit Answer
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
