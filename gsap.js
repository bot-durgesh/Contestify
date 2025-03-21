

document.addEventListener("DOMContentLoaded", function () {
    gsap.from(".logo", { opacity: 0, y: -20, duration: 1.5, ease: "power2.out" });
    gsap.from(".navigation ul li", { opacity: 0, y: -20, duration: 1, stagger: 0.2, ease: "power2.out" });

    gsap.from(".line1 p", { opacity: 0, x: -50, duration: 1, delay: 0.5, ease: "power2.out" });
    gsap.from(".line2 p", { opacity: 0, scale: 0.8, duration: 1, delay: 1, ease: "elastic.out(1, 0.5)" });
    gsap.from(".line3 p", { opacity: 0, y: 50, duration: 1, delay: 1.5, ease: "power2.out" });
    gsap.from(".line4 p", { opacity: 0, y: 50, duration: 1, delay: 2, ease: "power2.out" });
    gsap.from(".line5 p", { opacity: 0, y: 50, duration: 1, delay: 2.5, ease: "power2.out" });
    gsap.from(".line6 p", { opacity: 0, y: 50, duration: 1, delay: 3, ease: "power2.out" });
    gsap.from(".FAQS", { opacity: 0, y: 50, duration: 1, delay: 3.5, ease: "power2.out" });
    gsap.from(".Contact-us", { opacity: 0, y: 50, duration: 1, delay: 4, ease: "power2.out" });

    gsap.from(".container", { opacity: 0, scale: 0.8, duration: 1.5, delay: 2, ease: "power2.out" });
    gsap.from("table tbody tr", { opacity: 0, y: 30, duration: 1, stagger: 0.3, delay: 2.5 });

    document.querySelectorAll(".navigation a").forEach(link => {
        link.addEventListener("mouseenter", () => {
            gsap.to(link, { scale: 1.2, duration: 0.3, ease: "power2.out" });
        });
        link.addEventListener("mouseleave", () => {
            gsap.to(link, { scale: 1, duration: 0.3, ease: "power2.out" });
        });
    });
});

document.addEventListener("DOMContentLoaded", function () {
    let questions = document.querySelectorAll(".question");
  
    questions.forEach((question) => {
      question.addEventListener("click", function () {
        let answer = this.nextElementSibling;
  
        // Toggle answer visibility
        if (answer.style.display === "block") {
          answer.style.display = "none";
        } else {
          answer.style.display = "block";
        }
      });
    });
  });
  