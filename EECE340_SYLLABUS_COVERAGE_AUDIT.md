# EECE 340 Microprocessors & ARM Architecture — Syllabus-to-Platform Coverage Matrix & Audit

**Course Code:** EECE 340  
**Title:** Microprocessors & ARM Architecture  
**Syllabus Assessment Weighting:**  
- **Homework:** 10%  
- **Quizzes:** 15%  
- **Midterm Exam:** 25%  
- **Lab Work:** 10%  
- **Lab Exam:** 15%  
- **Final Exam:** 25%  
**Total:** 100%

---

## 1. Syllabus-to-Platform Coverage Matrix

| # | EECE 340 Syllabus Requirement | Current Status | Target Platform Module & Lab | Assessment Mapping | Language / Model |
|---|--------------------------------|----------------|------------------------------|--------------------|------------------|
| 1 | Microprocessor architecture and operation | Covered (mpr-01..mpr-06) | `microprocessors-arm` (Lessons 1–6) | Midterm, Quizzes | ARM ASM / Python model |
| 2 | ARM assembly programming | Covered (arm-01..arm-12) | `arm-assembly` (Lessons 1–12) | Homework, Lab Work | Native ARM ASM |
| 3 | Assembler directives, macros, constants & literal pools | Partially covered (arm-01) | `eece340-lab-02` | Homework, Lab Work | Native ARM ASM |
| 4 | Load/store instructions | Covered (arm-09) | `eece340-lab-04`, `arm-09` | Lab Exam, Midterm | Native ARM ASM |
| 5 | Addressing modes (offset, pre/post indexed, writeback) | Covered (arm-09) | `eece340-lab-04`, `arm-09` | Midterm, Lab Exam | Native ARM ASM |
| 6 | Data-processing instructions | Covered (arm-02..07) | `eece340-lab-03`, `arm-02..07` | Midterm, Quizzes | Native ARM ASM |
| 7 | Control flow, loops, branches, and tables | Covered (arm-08) | `eece340-lab-05`, `arm-08` | Homework, Lab Exam | Native ARM ASM |
| 8 | C++ comparison & mixed C++/assembly programming | Baseline in C++ track | `eece340-lab-01`, `eece340-lab-14` | Lab Work, Final Exam | C++ & Native ARM ASM |
| 9 | Memory interfacing | Theory in mpr-03..04 | `eece340-lab-06`, `eece340-lab-08` | Midterm, Final Exam | Python bus model / ASM |
| 10 | Address decoding | Missing practical lab | `eece340-lab-06` | Midterm, Final Exam | Python decoder / ASM |
| 11 | System timing | Theory in mpr-06 | `eece340-lab-07` | Midterm, Final Exam | Python timing model |
| 12 | Bus transactions | Baseline in comparch | `eece340-lab-07` | Midterm, Final Exam | Python cycle model |
| 13 | Parallel I/O | Baseline in embedded | `eece340-lab-09` | Lab Work, Final Exam | Native ARM ASM / Python |
| 14 | Serial I/O (UART) | Baseline in embedded | `eece340-lab-09` | Lab Work, Final Exam | Native ARM ASM / Python |
| 15 | Analog I/O (ADC/DAC) | Missing practical lab | `eece340-lab-09` | Lab Work, Final Exam | Native ARM ASM / Python |
| 16 | Memory-mapped peripherals | Baseline in embedded | `eece340-lab-10` | Lab Work, Lab Exam | Native ARM ASM |
| 17 | Static RAM and dynamic RAM | Theory in mpr-03..04 | `eece340-lab-08` | Midterm, Final Exam | Python memory controller |
| 18 | Hardware and software interrupts | Baseline in arm-12 | `eece340-lab-11`, `arm-12` | Lab Exam, Final Exam | Native ARM ASM |
| 19 | Interrupt controller behavior | Baseline in arm-12 | `eece340-lab-11` | Lab Exam, Final Exam | Native ARM ASM / Python |
| 20 | DMA (Direct Memory Access) | Missing practical lab | `eece340-lab-11` | Final Exam, Lab Work | Python DMA model / ASM |
| 21 | Vector tables | Covered (arm-12) | `eece340-lab-11`, `eece340-lab-15` | Midterm, Lab Exam | Native ARM ASM |
| 22 | Exceptions | Covered (arm-12, mpr-10) | `arm-12`, `eece340-lab-11` | Midterm, Quizzes | Native ARM ASM |
| 23 | Subroutines and stacks | Covered (arm-10, arm-11) | `eece340-lab-12`, `arm-10..11` | Midterm, Lab Exam | Native ARM ASM |
| 24 | Linked lists and search algorithms | In CPP track only | `eece340-lab-13` | Lab Exam, Final Exam | Native ARM ASM |
| 25 | ARM7/Keil board-oriented lab work | Missing practical lab | `eece340-lab-15` | Lab Work, Lab Exam | Keil ARM7 ASM / C++ |
| 26 | ARM University IoT/cloud fundamentals | Missing practical lab | `eece340-lab-15` | Homework, Lab Work | C++ / ARM ASM / JSON |
| 27 | Final lab-exam preparation | Missing practical lab | `eece340-lab-16` | Lab Exam (15% Weight) | Mixed C++ / ARM ASM |

---

## 2. Dedicated EECE 340 Laboratory Track (16 Modules)

Every lab module satisfies:
1. **Plain-English Objective**
2. **Exact Problem Statement**
3. **Commented Starter Code** (ARM Assembly `;`, C++ `//`, Python `#`)
4. **Line-by-Line Code Explanations** (Universal explainer compatible)
5. **Expected Output & State** (Registers, Memory, Flags, Bus states)
6. **Boundary & Failure Cases**
7. **Browser Modeling vs. Real Keil/ARM7 Hardware Notes**
8. **Written Submission Checkpoints**
9. **Authored Revealable Solutions**

### Lab Module Breakdown:
- **Lab 1: C++ and ARM Calling Convention Lab** (`eece340-lab-01`) — AAPCS standard, passing arguments via R0–R3, return in R0, preservation of R4–R11, 8-byte stack alignment.
- **Lab 2: Assembler Directives, Macros, Constants & Literal Pool Lab** (`eece340-lab-02`) — `EQU`, `RN`, `AREA`, `ENTRY`, `END`, `DCD`/`DCB`/`DCW`, `ALIGN`, `SPACE`, `MACRO`/`MEND`, `LTORG`.
- **Lab 3: ARM Arithmetic & Data Movement Lab** (`eece340-lab-03`) — Multi-word 64-bit integer arithmetic with `ADDS`/`ADC`, `SUBS`/`SBC`, `RSB`, `RSC`, and barrel shifter operations (`LSL`, `LSR`, `ASR`, `ROR`).
- **Lab 4: Load/Store & Addressing Modes Lab** (`eece340-lab-04`) — Immediate offset `[Rn, #k]`, pre-indexed writeback `[Rn, #k]!`, post-indexed `[Rn], #k`, scaled register offset, `LDRB`/`STRB`, `LDRH`/`STRH`, word alignment.
- **Lab 5: Control Flow, Loops, Branches & Jump Tables Lab** (`eece340-lab-05`) — Conditional branches, while/for loops, jump tables with branch target calculation and PC loading, bound checks.
- **Lab 6: Address Decoding & Memory Interfacing Lab** (`eece340-lab-06`) — Full vs partial address decoding, chip select Boolean equations, memory mapping (Flash, SRAM, Peripherals), address aliasing detection.
- **Lab 7: Bus Transactions & System Timing Lab** (`eece340-lab-07`) — Read/write bus cycles, clock cycles, setup/hold times ($t_{AS}, t_{ACC}, t_H$), wait states ($T_{WAIT}$) calculation and simulation.
- **Lab 8: SRAM & DRAM Interface Lab** (`eece340-lab-08`) — Static RAM vs Dynamic RAM cell architecture, RAS/CAS strobe timing, row/col multiplexing, refresh scheduling (64 ms retention window).
- **Lab 9: Parallel, Serial & Analog I/O Lab** (`eece340-lab-09`) — GPIO pin direction and state registers, UART transmit/receive FIFO polling, ADC successive approximation quantization ($V_{in} = \frac{D}{2^N-1}V_{ref}$).
- **Lab 10: Memory-Mapped Peripherals Lab** (`eece340-lab-10`) — Base register + offset access, bitwise manipulation (`ORR`, `BIC`, `TST`) on hardware control registers without corrupting reserved bits.
- **Lab 11: Interrupts, Vector Table & DMA Lab** (`eece340-lab-11`) — Interrupt vector table (`0x00000000`–`0x0000001C`), IRQ service routine, context preservation, `SUBS pc, lr, #4` return, DMA controller channel setup.
- **Lab 12: Subroutine Calling, Stacks & Reentrancy Lab** (`eece340-lab-12`) — Full Descending stack (`STMFD`/`LDMFD` / `PUSH`/`POP`), nested subroutine frames, recursive factorial, link register preservation.
- **Lab 13: Linked Lists & Search Algorithms Lab** (`eece340-lab-13`) — Dynamic memory traversal in ARM assembly, `[value, next_ptr]` structure, linear search, sorted list insertion, NULL pointer detection.
- **Lab 14: Mixed C++ & Assembly Integration Lab** (`eece340-lab-14`) — C++ calling ARM assembly routines with `extern "C"`, passing struct pointers, DSP vector filtering, returning composite status codes.
- **Lab 15: ARM7/Keil & University IoT/Cloud Guidance Lab** (`eece340-lab-15`) — Keil $\mu$Vision project configuration for ARM7TDMI (LPC2148), `startup.s` stack/heap initialization, scatter-loading `.sct` files, UART telemetry packet generation for IoT cloud ingest.
- **Lab 16: Timed Final Lab Exam Rehearsal** (`eece340-lab-16`) — 90-minute full exam simulation combining address decoding, ADC/GPIO peripheral control, stack-safe ISR, and C++ driver integration.

---

## 3. Simulator Reality & Hardware Limitations

- **Browser Capabilities:** Interactive execution trace of 32-bit ARM registers (R0–R15), CPSR condition flags (N, Z, C, V), word/byte memory addresses, and structured Python/C++ logic models.
- **Hardware Realities (Keil/ARM7):** Physical propagation delays, bus capacitance, oscillator clock jitter, JTAG in-circuit emulation, pipeline stalls/branch mispredictions, DMA bus contention, hardware interrupt latency, and silicon-specific silicon errata require Keil $\mu$Vision and target development boards.
