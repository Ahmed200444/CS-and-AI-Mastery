'use strict';
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const armPath = path.join(root, 'assets', 'arm-course-additions.json');
const matlabPath = path.join(root, 'assets', 'matlab-course-addition.json');

// 1. Microprocessors & ARM Lab Track definition (16 labs)
const eece340Labs = [
  {
    id: "eece340-lab-01",
    title: "C++ and ARM Calling Convention Lab",
    syllabusTopic: "C++ comparison and mixed C++/assembly programming; AAPCS calling standard",
    assessment: "Lab Work (10%), Final Exam (25%)",
    language: "armasm",
    supportingLanguage: "cpp",
    objective: "Understand the ARM Architecture Procedure Call Standard (AAPCS): arguments passed in R0–R3, return value in R0, preserving callee-saved registers R4–R11 on the stack, and maintaining 8-byte stack alignment.",
    problemStatement: "Implement an AAPCS-compliant ARM assembly subroutine compute_polynomial that calculates a * x^2 + b * x + c, where a is in R0, b is in R1, c is in R2, and x is in R3. Preserve any non-volatile registers used and return the 32-bit integer result in R0.",
    starterCode: "        AREA PolyCode, CODE, READONLY ; Declare code section\n        EXPORT compute_polynomial ; Export function name for C++ linkage\ncompute_polynomial ; Function entry point\n        PUSH {r4, lr} ; Preserve callee-saved register r4 and link register\n        MUL r4, r3, r3 ; Compute x^2 = x * x and store in r4\n        MUL r0, r0, r4 ; Compute a * x^2 and store in r0\n        MLA r0, r1, r3, r0 ; Compute (b * x) + (a * x^2) and store in r0\n        ADD r0, r0, r2 ; Add constant c to accumulate final polynomial\n        POP {r4, pc} ; Restore r4 and return by popping saved lr into pc\n        END ; Mark end of assembly source",
    expectedState: "With inputs a=2, b=3, c=4, x=5: computes 2*(25) + 3*(5) + 4 = 69. R0 = 69 (0x00000045), R4 restored, SP balanced.",
    boundaryCase: "Large operand values (e.g. a=10000, x=1000) cause 32-bit integer multiplication overflow; callers passing 5 or more parameters must pass the 5th+ argument on the stack.",
    hardwareNote: "Browser tracer models 32-bit register and stack behavior; Keil/ARM7 hardware toolchains enforce 8-byte stack alignment at external boundaries and check AAPCS frame records.",
    checkpoint: "Verify that R4 is restored to its caller value and R0 contains 69 when tested with (2, 3, 4, 5).",
    solutionCode: "        AREA PolyCode, CODE, READONLY ; Declare code section\n        EXPORT compute_polynomial ; Export function for C++ linkage\ncompute_polynomial ; Function entry point\n        PUSH {r4-r5, lr} ; Save non-volatile registers r4, r5, and link register\n        MUL r4, r3, r3 ; r4 = x * x (x^2)\n        MUL r5, r0, r4 ; r5 = a * x^2\n        MLA r0, r1, r3, r5 ; r0 = (b * x) + (a * x^2)\n        ADD r0, r0, r2 ; r0 = (a * x^2 + b * x) + c\n        POP {r4-r5, pc} ; Restore non-volatile registers and return\n        END ; End of assembly file",
    solutionExplanation: "The subroutine follows AAPCS by receiving arguments in R0-R3, using non-volatile registers R4-R5 safely by saving them on entry and restoring them on exit, calculating the quadratic term, and returning the result in R0."
  },
  {
    id: "eece340-lab-02",
    title: "Assembler Directives, Macros, Constants & Literal Pool Lab",
    syllabusTopic: "Assembler directives, macros, constants, and literal pools",
    assessment: "Homework (10%), Lab Work (10%)",
    language: "armasm",
    supportingLanguage: "armasm",
    objective: "Master assembler directives (AREA, ENTRY, END, ALIGN, SPACE, DCD, DCB), symbolic definitions (EQU, RN), macro definitions (MACRO, MEND), and literal pool placement (LTORG).",
    problemStatement: "Define symbolic bounds MIN_BOUND EQU 10 and MAX_BOUND EQU 100, register alias val RN 0, clamp val between bounds using conditional instructions, define an aligned lookup table with DCD, and place LTORG to dump literal constants.",
    starterCode: "MIN_BOUND EQU 10 ; Define symbolic lower bound constant\nMAX_BOUND EQU 100 ; Define symbolic upper bound constant\nval RN 0 ; Create readable alias for register r0\ntmp RN 1 ; Create readable alias for register r1\n\n        AREA DirectivesLab, CODE, READONLY ; Declare read-only code area\n        ENTRY ; Specify execution entry point\nstart ; Entry label\n        MOV val, #5 ; Load test value below lower bound\n        CMP val, #MIN_BOUND ; Compare test value against minimum bound\n        MOVLT val, #MIN_BOUND ; Clamp to minimum if value is less than bound\n        CMP val, #MAX_BOUND ; Compare test value against maximum bound\n        MOVGT val, #MAX_BOUND ; Clamp to maximum if value exceeds bound\n        LDR tmp, =0x12345678 ; Load 32-bit constant from literal pool\n        LTORG ; Force assembler to dump literal pool here\nstop B stop ; Infinite loop halting processor\n        END ; End of assembly file",
    expectedState: "val (R0) is clamped from 5 to 10 (0x0000000A); tmp (R1) is loaded with 0x12345678; literal pool is placed immediately following LTORG.",
    boundaryCase: "Placing LDR rX, =constant more than 4095 bytes from literal pool without LTORG causes assembler error 'Literal pool out of range'; missing ALIGN 4 after DCB strings causes unaligned word reads.",
    hardwareNote: "Browser tracer resolves basic literals; Keil armasm evaluates multi-pass macro expansions, literal pool offsets, and flags unaligned section boundaries.",
    checkpoint: "Verify clamping for test inputs 5, 50, and 150, confirming R0 is bounded in [10, 100].",
    solutionCode: "MIN_VAL EQU 10 ; Define minimum clamp value\nMAX_VAL EQU 100 ; Define maximum clamp value\ninput RN 0 ; Input/output register alias\nlimit RN 1 ; Scratch limit register alias\n\n        AREA ClampArea, CODE, READONLY ; Define code area\n        ENTRY ; Set entry point\nmain ; Main entry label\n        MOV input, #150 ; Load test value exceeding upper bound\n        MOV limit, #MIN_VAL ; Load lower bound into scratch register\n        CMP input, limit ; Check if input is below lower bound\n        MOVLT input, limit ; Clamp input up to lower bound if less\n        MOV limit, #MAX_VAL ; Load upper bound into scratch register\n        CMP input, limit ; Check if input exceeds upper bound\n        MOVGT input, limit ; Clamp input down to upper bound if greater\n        LDR r2, =0xAABBCCDD ; Request 32-bit literal constant\n        LTORG ; Place literal pool before code end\ntrap B trap ; Terminate in spin loop\n        END ; End of assembly source",
    solutionExplanation: "EQU and RN define meaningful constants and register names; conditional moves perform branchless clamping; LTORG forces immediate allocation of literal table data."
  },
  {
    id: "eece340-lab-03",
    title: "ARM Arithmetic & Data Movement Lab",
    syllabusTopic: "Data-processing instructions, 64-bit multiword arithmetic, barrel shifter",
    assessment: "Midterm (25%), Quizzes (15%)",
    language: "armasm",
    supportingLanguage: "armasm",
    objective: "Implement multi-word (64-bit) addition and subtraction using ADDS, ADC, SUBS, SBC, and apply flexible second operand barrel shifter transformations (LSL, LSR, ASR, ROR).",
    problemStatement: "Implement a 64-bit unsigned addition: operand 1 in (R1:R0, where R1 is MSW, R0 is LSW) and operand 2 in (R3:R2, where R3 is MSW, R2 is LSW). Add lower words with ADDS to set carry, add upper words with ADC, and multiply the sum by 8 using barrel shifting.",
    starterCode: "        AREA MultiWord, CODE, READONLY ; Declare code area\n        ENTRY ; Entry point\nstart ; Program start\n        MOV r0, #0xFFFFFFFF ; Set lower 32 bits of operand 1\n        MOV r1, #0x00000001 ; Set upper 32 bits of operand 1\n        MOV r2, #0x00000001 ; Set lower 32 bits of operand 2\n        MOV r3, #0x00000000 ; Set upper 32 bits of operand 2\n        ADDS r0, r0, r2 ; Add lower words and update Carry flag (C=1)\n        ADC r1, r1, r3 ; Add upper words including Carry flag\n        MOV r4, r0, LSL #3 ; Shift lower sum left by 3 (multiply by 8)\nstop B stop ; Halt execution\n        END ; End of assembly source",
    expectedState: "Lower word R0 overflows to 0x00000000 with C=1; Upper word R1 becomes 1 + 0 + 1 = 2; 64-bit result is 0x0000000200000000.",
    boundaryCase: "64-bit overflow occurs when MSW addition generates a carry out of bit 63; signed subtraction requires monitoring the V (overflow) flag.",
    hardwareNote: "Browser models 32-bit register updates and status flags; hardware ARM7 pipeline executes barrel shifter operations simultaneously with the ALU in a single cycle.",
    checkpoint: "Verify that lower word carry propagates into upper word, yielding R1:R0 = 0x00000002:0x00000000.",
    solutionCode: "        AREA Arith64, CODE, READONLY ; Code section\n        ENTRY ; Program entry\nrun ; Label run\n        MOV r0, #0xFFFFFFFE ; Lower word 1: 0xFFFFFFFE\n        MOV r1, #0x00000005 ; Upper word 1: 5\n        MOV r2, #0x00000004 ; Lower word 2: 4\n        MOV r3, #0x00000002 ; Upper word 2: 2\n        ADDS r0, r0, r2 ; Lower sum: 0x00000002, sets Carry flag C=1\n        ADC r1, r1, r3 ; Upper sum: 5 + 2 + 1 = 8 (0x00000008)\n        SUBS r4, r0, #0x00000010 ; Subtract 16 from lower word, checks borrow\n        SBC r5, r1, #0 ; Subtract borrow from upper word\nhalt B halt ; Loop forever\n        END ; Source termination",
    solutionExplanation: "ADDS writes arithmetic status to CPSR; ADC reads the carry flag to complete 64-bit addition; SUBS/SBC perform the corresponding multi-word subtraction."
  },
  {
    id: "eece340-lab-04",
    title: "Load/Store & Addressing Modes Lab",
    syllabusTopic: "Load/store instructions, pre/post indexed addressing modes, byte/halfword transfers",
    assessment: "Midterm (25%), Lab Exam (15%)",
    language: "armasm",
    supportingLanguage: "armasm",
    objective: "Master ARM addressing modes: offset addressing [Rn, #k], pre-indexed writeback [Rn, #k]!, post-indexed [Rn], #k, scaled register offset, and byte/halfword transfers (LDRB, STRB, LDRH, STRH).",
    problemStatement: "Write an ARM assembly routine that reads a word from memory starting at 0x1000, doubles the value, and stores the updated word to destination memory 0x2000 using post-indexed reading and pre-indexed writeback storing.",
    starterCode: "        AREA AddressingLab, CODE, READONLY ; Declare code area\n        ENTRY ; Entry point\nstart ; Start label\n        MOV r0, #0x1000 ; Source buffer base pointer\n        MOV r1, #0x2000 ; Destination buffer base pointer\n        MOV r2, #42 ; Value to write into test memory\n        STR r2, [r0] ; Store test value at source address\n        LDR r3, [r0], #4 ; Post-indexed load: r3=[r0], then r0=r0+4\n        ADD r3, r3, r3 ; Double loaded value (r3 = 42 * 2 = 84)\n        STR r3, [r1, #4]! ; Pre-indexed store: r1=r1+4, then [r1]=r3\nstop B stop ; Halt\n        END ; End of file",
    expectedState: "R0 advances to 0x1004; R1 advances to 0x2004; Memory at 0x1000 holds 42; Memory at 0x2004 holds 84.",
    boundaryCase: "Non-word-aligned addresses (e.g. 0x1001 for a word transfer) cause data rotation on classic ARM7 or Alignment Abort exception on Cortex cores.",
    hardwareNote: "Browser memory model enforces 4-byte word alignment; ARM7 hardware rotates unaligned word reads based on address bits [1:0].",
    checkpoint: "Verify that R0 advances by 4 after load and R1 advances by 4 before store.",
    solutionCode: "        AREA ArrayCopy, CODE, READONLY ; Define code area\n        ENTRY ; Program entry\nmain ; Entry point\n        MOV r0, #0x1000 ; Source base pointer\n        MOV r1, #0x2000 ; Destination base pointer\n        MOV r2, #10 ; Element 1 value\n        STR r2, [r0, #0] ; Store element 1\n        MOV r2, #20 ; Element 2 value\n        STR r2, [r0, #4] ; Store element 2\n        LDR r3, [r0], #4 ; Load element 1, advance r0 to 0x1004\n        STR r3, [r1], #4 ; Store element 1, advance r1 to 0x2004\n        LDR r3, [r0], #4 ; Load element 2, advance r0 to 0x1008\n        STR r3, [r1], #4 ; Store element 2, advance r1 to 0x2008\nspin B spin ; Halt\n        END ; File end",
    solutionExplanation: "Post-indexed addressing [r0], #4 transfers the current word then increments the pointer; pre-indexed writeback [r1, #4]! updates the base register before the write."
  },
  {
    id: "eece340-lab-05",
    title: "Control Flow, Loops, Branches & Jump Tables Lab",
    syllabusTopic: "Control flow, loops, branches, condition codes, jump tables",
    assessment: "Homework (10%), Lab Exam (15%)",
    language: "armasm",
    supportingLanguage: "armasm",
    objective: "Construct structured loops (while/for/do-while), multi-way decision trees with condition codes, and efficient jump tables using PC modification for command dispatch.",
    problemStatement: "Implement a command dispatcher that takes an opcode (0, 1, or 2) in R0, checks bounds (range 0–2), uses branching to execute handle_add (opcode 0: R3 = R1 + R2), handle_sub (opcode 1: R3 = R1 - R2), or handle_and (opcode 2: R3 = R1 AND R2), returning 0xFFFFFFFF for invalid opcodes.",
    starterCode: "        AREA JumpTableLab, CODE, READONLY ; Declare code area\n        ENTRY ; Program entry\nstart ; Main entry\n        MOV r0, #1 ; Test opcode: 1 (subtract command)\n        MOV r1, #50 ; Operand 1 = 50\n        MOV r2, #20 ; Operand 2 = 20\n        CMP r0, #2 ; Verify opcode is within valid range (0..2)\n        BHI invalid ; Branch if unsigned higher than maximum opcode\n        CMP r0, #0 ; Check for opcode 0\n        BEQ handle_add ; Jump to addition handler\n        CMP r0, #1 ; Check for opcode 1\n        BEQ handle_sub ; Jump to subtraction handler\n        B handle_and ; Opcode 2 falls through to bitwise AND handler\nhandle_add ; Addition handler label\n        ADD r3, r1, r2 ; r3 = 50 + 20 = 70\n        B done ; Complete dispatch\nhandle_sub ; Subtraction handler label\n        SUB r3, r1, r2 ; r3 = 50 - 20 = 30\n        B done ; Complete dispatch\nhandle_and ; Bitwise AND handler label\n        AND r3, r1, r2 ; r3 = 50 AND 20\n        B done ; Complete dispatch\ninvalid ; Invalid opcode handler label\n        MOV r3, #-1 ; Error indicator 0xFFFFFFFF\ndone B done ; Halt\n        END ; File end",
    expectedState: "Opcode 1 executes handle_sub, resulting in R3 = 30 (0x0000001E). Opcode 5 branches to invalid setting R3 = 0xFFFFFFFF.",
    boundaryCase: "Negative opcodes or values >= 3 without BHI unsigned check branch into undefined routines; off-by-one table indexing.",
    hardwareNote: "Browser tracer models control flow and register updates; hardware pipelines fetch instructions 2 words ahead, requiring PC compensation when writing to R15 directly.",
    checkpoint: "Test opcodes 0, 1, 2, and 5 to verify correct branching and error trap.",
    solutionCode: "        AREA Dispatch, CODE, READONLY ; Declare code area\n        ENTRY ; Entry point\nmain ; Entry label\n        MOV r0, #0 ; Command opcode 0 (ADD)\n        MOV r1, #15 ; Input A = 15\n        MOV r2, #25 ; Input B = 25\n        CMP r0, #2 ; Range test against max valid opcode\n        BHI error_trap ; Branch if out of range\n        CMP r0, #0 ; Test for opcode 0\n        BEQ do_add ; Branch to addition handler\n        CMP r0, #1 ; Test for opcode 1\n        BEQ do_sub ; Branch to subtraction handler\n        AND r3, r1, r2 ; Opcode 2: bitwise AND\n        B exit ; Exit\ndo_add ADD r3, r1, r2 ; r3 = 15 + 25 = 40\n        B exit ; Exit\ndo_sub SUB r3, r1, r2 ; r3 = 15 - 25 = -10\n        B exit ; Exit\nerror_trap ; Trap invalid opcode label\n        MOV r3, #-1 ; Set error return code\nexit B exit ; Halt\n        END ; Source end",
    solutionExplanation: "Range validation with CMP and BHI prevents out-of-bounds execution; conditional branches route control to dedicated handler blocks."
  },
  {
    id: "eece340-lab-06",
    title: "Address Decoding & Memory Interfacing Lab",
    syllabusTopic: "Address decoding, memory map partitioning, chip select logic, bus aliasing",
    assessment: "Midterm (25%), Final Exam (25%)",
    language: "python",
    supportingLanguage: "armasm",
    objective: "Design and verify address decoding logic for a microprocessor memory system, partitioning 32-bit address space into Flash ROM, SRAM, and Memory-Mapped Peripherals while checking for aliasing.",
    problemStatement: "Model address decoding for a system with 64 KB ROM at 0x00000000-0x0000FFFF, 128 KB SRAM at 0x40000000-0x4001FFFF, and 4 KB MMIO at 0xE0000000-0xE0000FFF. Write a Python decoder model that verifies chip-select lines CS_ROM, CS_SRAM, CS_MMIO and flags unmapped access.",
    starterCode: "# Address decoding model for 32-bit microprocessor bus\ndef decode_address(address):  # Function to decode address\n    cs_rom = (address >= 0x00000000) and (address <= 0x0000FFFF)  # 64 KB Flash ROM\n    cs_sram = (address >= 0x40000000) and (address <= 0x4001FFFF)  # 128 KB SRAM\n    cs_mmio = (address >= 0xE0000000) and (address <= 0xE0000FFF)  # 4 KB MMIO registers\n    if cs_rom:  # Check ROM range\n        return \"CS_ROM\"  # Return ROM chip select\n    elif cs_sram:  # Check SRAM range\n        return \"CS_SRAM\"  # Return SRAM chip select\n    elif cs_mmio:  # Check MMIO range\n        return \"CS_MMIO\"  # Return MMIO chip select\n    else:  # Unmapped space\n        return \"BUS_ERROR\"  # Return unmapped error\n# Test address range verification\nfor test_addr in [0x00001000, 0x40005000, 0xE0000020, 0x20000000]:  # Test addresses\n    print(f\"{hex(test_addr)} -> {decode_address(test_addr)}\")  # Print decoded result",
    expectedState: "0x00001000 -> CS_ROM; 0x40005000 -> CS_SRAM; 0xE0000020 -> CS_MMIO; 0x20000000 -> BUS_ERROR.",
    boundaryCase: "Accessing 0x00010000 (just 1 byte past 64 KB ROM) must return BUS_ERROR, preventing memory overrun.",
    hardwareNote: "In physical hardware, 74LS138 decoders or FPGA logic implement these Boolean equations; incomplete decoding causes address aliasing where one device mirrors across multiple address ranges.",
    checkpoint: "Verify that valid ranges assert exactly one chip select and unmapped addresses trigger BUS_ERROR.",
    solutionCode: "# Full address decoding verification\ndef check_memory_space(addr):  # Function to inspect memory space\n    # Decode upper address bits [31:16]\n    upper = addr >> 16  # Extract upper 16 bits\n    if upper == 0x0000:  # ROM region 0x0000xxxx\n        return \"FLASH_ROM_SELECTED\"  # Flash ROM selected\n    elif 0x4000 <= upper <= 0x4001:  # SRAM region 0x4000xxxx-0x4001xxxx\n        return \"SRAM_SELECTED\"  # SRAM selected\n    elif upper == 0xE000:  # MMIO region 0xE000xxxx\n        return \"PERIPHERAL_SELECTED\"  # Peripheral selected\n    return \"ILLEGAL_ADDRESS_FAULT\"  # Unmapped access\n\nprint(check_memory_space(0x40001234))  # Test SRAM address",
    solutionExplanation: "The address decoder slices the top address bits to produce mutual exclusive chip select assertions and traps invalid accesses."
  },
  {
    id: "eece340-lab-07",
    title: "Bus Transactions & System Timing Lab",
    syllabusTopic: "System timing, bus transactions, setup/hold times, wait state calculations",
    assessment: "Midterm (25%), Final Exam (25%)",
    language: "python",
    supportingLanguage: "armasm",
    objective: "Analyze bus read and write cycles, compute required wait states based on clock period and memory access time (tACC), and verify setup and hold timing margins.",
    problemStatement: "A 50 MHz ARM processor has a clock cycle period T_cyc = 20 ns. External memory has an access time t_ACC = 75 ns. Write a timing model to calculate required wait states N_wait = ceil((t_ACC - T_cyc) / T_cyc) and simulate the bus cycle phases (Address, Wait States, Data Latch).",
    starterCode: "# Bus timing and wait state calculator\nimport math  # Math utility for ceiling function\n\nclock_freq_mhz = 50.0  # CPU clock frequency in MHz\nt_cyc_ns = 1000.0 / clock_freq_mhz  # Clock cycle period = 20.0 ns\nt_acc_ns = 75.0  # External memory access time = 75.0 ns\n\n# Compute wait states required beyond 1 base cycle\nwait_states = math.ceil((t_acc_ns - t_cyc_ns) / t_cyc_ns)  # ceil((75-20)/20) = 3\ntotal_cycles = 1 + wait_states + 1  # Address phase (1) + Wait (3) + Latch (1)\ntotal_time_ns = total_cycles * t_cyc_ns  # Total bus cycle duration\n\nprint(f\"Clock period: {t_cyc_ns} ns\")  # Output period\nprint(f\"Wait states required: {wait_states}\")  # Output wait states\nprint(f\"Total bus cycle duration: {total_time_ns} ns\")  # Output total duration",
    expectedState: "Clock period = 20.0 ns; Wait states = 3; Total bus cycles = 5; Total duration = 100.0 ns (satisfies 75 ns t_ACC with 25 ns margin).",
    boundaryCase: "Configuring 0 wait states on a 75 ns memory causes setup time violation and data corruption on the read data bus.",
    hardwareNote: "Physical boards require oscilloscope / logic analyzer verification of t_AS, t_ACC, and t_H; memory controllers insert hardware wait states by pulling the nWAIT / READY line low.",
    checkpoint: "Calculate wait states for a 100 MHz CPU with 45 ns memory and verify total transaction duration.",
    solutionCode: "# Bus transaction phase simulation\ndef simulate_bus_read(clock_mhz, mem_access_ns):  # Calculate transaction phases\n    t_clk = 1000.0 / clock_mhz  # Clock cycle in ns\n    n_wait = max(0, int((mem_access_ns - t_clk + t_clk - 1) // t_clk))  # Integer ceil\n    phases = [\"T1: ADDRESS_DRIVE\"]  # Address drive phase\n    for i in range(n_wait):  # Insert required wait states\n        phases.append(f\"TW{i+1}: WAIT_STATE\")  # Wait state insertion\n    phases.append(\"T2: DATA_LATCH\")  # Data latch phase\n    return n_wait, (len(phases) * t_clk), phases  # Return wait count, duration, log\n\nwait_count, duration, log = simulate_bus_read(50, 75)  # Run simulation for 50MHz / 75ns\nprint(f\"Wait count: {wait_count}, Duration: {duration} ns\")  # Print timing results",
    solutionExplanation: "The processor extends the bus cycle by inserting wait states (TW) until the memory device's access time requirement is met before latching data."
  },
  {
    id: "eece340-lab-08",
    title: "SRAM & DRAM Interface Lab",
    syllabusTopic: "Static RAM and dynamic RAM interfacing, RAS/CAS timing, refresh cycles",
    assessment: "Midterm (25%), Final Exam (25%)",
    language: "python",
    supportingLanguage: "armasm",
    objective: "Understand SRAM (static latch) vs DRAM (capacitor storage) interfacing, row/column address multiplexing (RAS/CAS), and periodic refresh scheduling within 64 ms retention limits.",
    problemStatement: "Model a DRAM memory controller that decodes a 32-bit physical address into Bank, Row, and Column addresses, and schedules refresh operations every 7.81 microseconds across 8192 rows (64 ms total retention).",
    starterCode: "# DRAM row/column decoding and refresh timing model\nTOTAL_ROWS = 8192  # 8192 rows in DRAM array\nRETENTION_TIME_MS = 64.0  # Maximum retention time = 64 ms\nREFRESH_INTERVAL_US = (RETENTION_TIME_MS * 1000.0) / TOTAL_ROWS  # 7.8125 us\n\ndef decode_dram_addr(phys_addr):  # Decode physical address to DRAM coordinates\n    col = phys_addr & 0x3FF  # 10 bits column address (bits 9:0)\n    row = (phys_addr >> 10) & 0x1FFF  # 13 bits row address (bits 22:10)\n    bank = (phys_addr >> 23) & 0x3  # 2 bits bank address (bits 24:23)\n    return bank, row, col  # Return bank, row, and column\n\nbank, row, col = decode_dram_addr(0x00A12340)  # Test address\nprint(f\"Bank: {bank}, Row: {row}, Col: {col}\")  # Print decoded components\nprint(f\"Refresh interval: {REFRESH_INTERVAL_US:.2f} us per row\")  # Print refresh rate",
    expectedState: "For address 0x00A12340: Bank = 1, Row = 2098, Col = 832; Refresh interval = 7.81 us per row.",
    boundaryCase: "Missing a refresh cycle due to continuous bus transactions causes capacitive discharge and bit corruption in dynamic cells.",
    hardwareNote: "SRAM interfaces directly with static chip-select and write-enable lines; DRAM controllers require specialized auto-refresh counters, row precharge (tRP), and CAS latency (CL) state machines.",
    checkpoint: "Verify that 8192 rows refreshed at 7.8125 us intervals complete a full refresh cycle within 64 ms.",
    solutionCode: "# DRAM memory controller state machine simulation\ndef process_dram_request(is_page_hit):  # Calculate latency based on page status\n    if is_page_hit:  # Open row page hit\n        return 2  # CAS Latency only: 2 cycles\n    else:  # Row page miss\n        return 6  # Precharge (2) + Activate (2) + CAS Latency (2) = 6 cycles\n\nprint(f\"Page hit latency: {process_dram_request(True)} cycles\")  # Test page hit\nprint(f\"Page miss latency: {process_dram_request(False)} cycles\")  # Test page miss",
    solutionExplanation: "DRAM multiplexes addresses on shared pins using RAS# and CAS# strobes; open row page hits execute with low latency while page misses require precharge and activate cycles."
  },
  {
    id: "eece340-lab-09",
    title: "Parallel, Serial & Analog I/O Lab",
    syllabusTopic: "Parallel I/O, UART serial I/O, ADC/DAC analog I/O quantization",
    assessment: "Lab Work (10%), Final Exam (25%)",
    language: "armasm",
    supportingLanguage: "python",
    objective: "Program GPIO parallel I/O ports, configure UART serial communication (transmitter holding register polling), and calculate ADC successive-approximation quantization.",
    problemStatement: "Write an ARM assembly polling routine for a UART peripheral (Base 0xE000C000): poll Line Status Register (LSR at offset 0x14) bit 5 (Transmitter Empty THRE), write character 'A' (0x41) to Transmitter Holding Register (THR at offset 0x00).",
    starterCode: "UART_BASE EQU 0xE000C000 ; UART0 base address\nLSR_OFFSET EQU 0x14 ; Line status register offset\nTHR_OFFSET EQU 0x00 ; Transmitter holding register offset\nTHRE_BIT EQU 0x20 ; Bit 5: Transmitter Holding Register Empty mask\n\n        AREA UartLab, CODE, READONLY ; Declare code area\n        ENTRY ; Entry point\nstart ; Start label\n        LDR r0, =UART_BASE ; Load UART peripheral base address\npoll_tx ; Polling loop label\n        LDR r1, [r0, #LSR_OFFSET] ; Read Line Status Register\n        TST r1, #THRE_BIT ; Test bit 5 (THRE)\n        BEQ poll_tx ; If zero, transmitter is busy, continue polling\n        MOV r2, #0x41 ; Load ASCII character 'A'\n        STR r2, [r0, #THR_OFFSET] ; Write character to transmit holding register\nstop B stop ; Halt\n        END ; End of source",
    expectedState: "Polling loop reads LSR until THRE bit 5 is high; writes ASCII 'A' (0x41) into THR; transmit sequence completes.",
    boundaryCase: "Writing to THR before previous transmission completes causes FIFO overflow / character overwrite; ADC sampling rate exceeding maximum conversion bandwidth causes signal aliasing.",
    hardwareNote: "Browser models register read/write polling; physical UART connects to MAX232 / FTDI level shifters with precise baud rate clock dividers.",
    checkpoint: "Verify that TST checks bit 5 and BEQ branches while busy until bit 5 becomes 1.",
    solutionCode: "        AREA IoDriver, CODE, READONLY ; Code area\n        ENTRY ; Entry point\nmain ; Entry label\n        MOV r0, #0x2000 ; Simulated UART base\n        MOV r1, #0x20 ; Set simulated THRE status ready bit\n        STR r1, [r0, #0x14] ; Write ready status to simulated LSR\n        LDR r2, [r0, #0x14] ; Read status\n        TST r2, #0x20 ; Test ready bit\n        MOVNE r3, #0x48 ; If ready, load ASCII 'H' (0x48)\n        STRNE r3, [r0, #0x00] ; Transmit character\nhalt B halt ; Loop forever\n        END ; End of assembly",
    solutionExplanation: "The polling driver checks the hardware status flag before each write, preventing data corruption and buffer overruns."
  },
  {
    id: "eece340-lab-10",
    title: "Memory-Mapped Peripherals Lab",
    syllabusTopic: "Memory-mapped peripherals, control/status registers, bit masking with BIC/ORR/TST",
    assessment: "Lab Work (10%), Lab Exam (15%)",
    language: "armasm",
    supportingLanguage: "armasm",
    objective: "Control hardware timer and GPIO peripherals through memory-mapped register offsets using bit manipulation (ORR to set bits, BIC to clear bits, TST to inspect bits) without corrupting reserved register fields.",
    problemStatement: "Configure an on-chip timer at base 0x40004000: enable timer and reset counter in Timer Control Register (TCR at offset 0x04), set Match Register 0 (MR0 at offset 0x18) to 10000, and configure Match Control Register (MCR at offset 0x14) to generate an interrupt and reset counter on match.",
    starterCode: "TIMER_BASE EQU 0x40004000 ; Timer 0 peripheral base address\nTCR_OFF EQU 0x04 ; Timer control register offset\nMCR_OFF EQU 0x14 ; Match control register offset\nMR0_OFF EQU 0x18 ; Match register 0 offset\n\n        AREA TimerLab, CODE, READONLY ; Declare code area\n        ENTRY ; Entry point\nstart ; Main entry\n        LDR r0, =TIMER_BASE ; Load peripheral base address\n        MOV r1, #10000 ; Set match comparison count (10000 ticks)\n        STR r1, [r0, #MR0_OFF] ; Write match value into MR0\n        MOV r1, #0x03 ; Bits 0 and 1: Interrupt and Reset on MR0 match\n        STR r1, [r0, #MCR_OFF] ; Configure Match Control Register\n        MOV r1, #0x01 ; Bit 0: Timer Enable\n        STR r1, [r0, #TCR_OFF] ; Enable timer counter in TCR\nstop B stop ; Halt\n        END ; End of source",
    expectedState: "MR0 at [0x40004018] = 10000; MCR at [0x40004014] = 0x03; TCR at [0x40004004] = 0x01.",
    boundaryCase: "Using STR to write an entire word over a shared control register without read-modify-write (ORR/BIC) inadvertently clears adjacent peripheral configuration bits.",
    hardwareNote: "Peripheral registers are mapped into physical memory space; C/C++ drivers must declare pointers with the 'volatile' keyword to prevent compiler dead-code elimination.",
    checkpoint: "Verify that MR0, MCR, and TCR are written with the correct configuration values.",
    solutionCode: "        AREA PeriConfig, CODE, READONLY ; Declare code area\n        ENTRY ; Program entry\nmain ; Entry label\n        MOV r0, #0x3000 ; Base peripheral address\n        MOV r1, #0x00 ; Initialize register value\n        ORR r1, r1, #0x01 ; Set Bit 0 (Enable)\n        ORR r1, r1, #0x02 ; Set Bit 1 (Reset Counter)\n        STR r1, [r0, #0x04] ; Write to control register\n        BIC r1, r1, #0x02 ; Clear Bit 1 (Release Reset)\n        STR r1, [r0, #0x04] ; Update control register\ntrap B trap ; Spin loop\n        END ; End of assembly",
    solutionExplanation: "Bitwise ORR sets specific configuration bits while BIC clears selected bits without modifying unrelated control fields."
  },
  {
    id: "eece340-lab-11",
    title: "Interrupts, Vector Table & DMA Lab",
    syllabusTopic: "Hardware/software interrupts, interrupt controller, vector tables, DMA transfers",
    assessment: "Lab Exam (15%), Final Exam (25%)",
    language: "armasm",
    supportingLanguage: "python",
    objective: "Configure ARM exception vector tables (0x00000000–0x0000001C), implement an IRQ Interrupt Service Routine with register preservation, return using SUBS pc, lr, #4, and model DMA block transfers.",
    problemStatement: "Write an ARM assembly IRQ Interrupt Service Routine: preserve corrupted registers on the IRQ stack, increment an interrupt counter in SRAM at 0x40000000, clear the peripheral interrupt source, and return atomically using SUBS pc, lr, #4.",
    starterCode: "        AREA IrqHandler, CODE, READONLY ; Declare code area\n        EXPORT IRQ_Handler ; Export ISR name\nIRQ_Handler ; ISR entry point\n        SUB lr, lr, #4 ; Adjust link register for pipeline offset\n        STMFD sp!, {r0-r3, lr} ; Save working registers and adjusted return address\n        MOV r0, #0x40000000 ; Load interrupt tick counter memory address\n        LDR r1, [r0] ; Read current tick count\n        ADD r1, r1, #1 ; Increment tick count\n        STR r1, [r0] ; Store updated tick count\n        LDMFD sp!, {r0-r3, pc}^ ; Restore registers and restore CPSR from SPSR (atomic return)\n        END ; End of source",
    expectedState: "Interrupt counter at 0x40000000 incremented by 1; IRQ mode registers R0-R3 restored; PC restored to interrupted instruction; CPSR restored from SPSR.",
    boundaryCase: "Returning from IRQ with MOV pc, lr skips the interrupted instruction due to the 4-byte pipeline prefetch offset; nested interrupts require saving SPSR and LR_irq on stack before re-enabling interrupts.",
    hardwareNote: "Browser models register preservation and return syntax; real hardware NVIC / VIC manages interrupt priority arbitration, hardware tail-chaining, and DMA cycle stealing.",
    checkpoint: "Verify that LDMFD with ^ restores CPSR from SPSR and returns to the exact interrupted instruction.",
    solutionCode: "        AREA VectorTable, CODE, READONLY ; Vector table area\n        ENTRY ; Entry point\nVectors ; Vector table entry label\n        B Reset_Handler ; 0x00: Reset vector\n        B Undef_Handler ; 0x04: Undefined instruction\n        B SVC_Handler ; 0x08: Software interrupt\n        B Prefetch_Handler ; 0x0C: Prefetch abort\n        B Data_Handler ; 0x10: Data abort\n        NOP ; 0x14: Reserved vector\n        B IRQ_Handler ; 0x18: IRQ handler\n        B FIQ_Handler ; 0x1C: FIQ handler\nReset_Handler ; Reset handler label\nUndef_Handler ; Undefined instruction handler label\nSVC_Handler ; Software interrupt handler label\nPrefetch_Handler ; Prefetch abort handler label\nData_Handler ; Data abort handler label\nIRQ_Handler ; IRQ handler label\nFIQ_Handler ; FIQ handler label\n        B Reset_Handler ; Default loop\n        END ; End of vector table",
    solutionExplanation: "The ARM vector table maps 8 standard exception vectors at 4-byte intervals from 0x00000000 to 0x0000001C, branching to dedicated handlers."
  },
  {
    id: "eece340-lab-12",
    title: "Subroutine Calling, Stacks & Reentrancy Lab",
    syllabusTopic: "Subroutines and stacks, STMFD/LDMFD, nested calling frames, reentrancy",
    assessment: "Midterm (25%), Lab Exam (15%)",
    language: "armasm",
    supportingLanguage: "armasm",
    objective: "Implement subroutines using the ARM Full Descending (FD) stack, manage nested activation frames with STMFD / LDMFD, preserve link register LR and callee-saved registers (R4–R11), and implement recursion.",
    problemStatement: "Implement a recursive factorial function factorial(n) in ARM assembly: input n in R0, base case n <= 1 returns 1, recursive step computes n * factorial(n - 1), managing the stack frame with STMFD sp!, {r4, lr} and LDMFD sp!, {r4, pc}.",
    starterCode: "        AREA FactLab, CODE, READONLY ; Declare code area\n        ENTRY ; Program entry\nstart ; Entry point\n        MOV r0, #4 ; Compute factorial of 4 (4! = 24)\n        BL factorial ; Call factorial subroutine\nstop B stop ; Halt when finished\n\nfactorial ; Subroutine entry\n        PUSH {r4, lr} ; Save callee register r4 and return address lr\n        MOV r4, r0 ; Save current argument n in r4\n        CMP r0, #1 ; Test for base case n <= 1\n        BGT recurse ; If n > 1, branch to recursive call\n        MOV r0, #1 ; Base case result = 1\n        POP {r4, pc} ; Restore r4 and return to caller\nrecurse ; Recursive step label\n        SUB r0, r0, #1 ; Set argument = n - 1\n        BL factorial ; Recursive call: factorial(n - 1)\n        MUL r0, r4, r0 ; Compute n * factorial(n - 1)\n        POP {r4, pc} ; Restore r4 and return to caller\n        END ; End of source",
    expectedState: "For n = 4: R0 = 24 (0x00000018); SP balanced and restored to starting stack pointer.",
    boundaryCase: "Input n = 0 must return 1; deep recursion without base case termination causes stack overflow into data memory.",
    hardwareNote: "Browser tracer models recursive stack frames; real hardware triggers Data Abort or HardFault when stack exceeds physical RAM boundaries.",
    checkpoint: "Trace factorial(4) step by step, confirming stack growth and unwinding to final result 24.",
    solutionCode: "        AREA FactRecursive, CODE, READONLY ; Define code area\n        EXPORT factorial_func ; Export symbol\nfactorial_func ; Subroutine entry label\n        STMFD sp!, {r4, lr} ; Push r4 and link register onto stack\n        MOV r4, r0 ; Preserve n in r4\n        CMP r0, #1 ; Check base case\n        BLE base_case ; Branch if n <= 1\n        SUB r0, r0, #1 ; Prepare argument n - 1\n        BL factorial_func ; Compute factorial(n - 1)\n        MUL r0, r4, r0 ; Multiply: n * factorial(n - 1)\n        LDMFD sp!, {r4, pc} ; Pop r4 and return\nbase_case ; Base case label\n        MOV r0, #1 ; Base case returns 1\n        LDMFD sp!, {r4, pc} ; Pop r4 and return\n        END ; Source end",
    solutionExplanation: "STMFD saves context on stack allocation and LDMFD restores state and pops directly into PC to return from nested calls."
  },
  {
    id: "eece340-lab-13",
    title: "Linked Lists & Search Algorithms Lab",
    syllabusTopic: "Linked lists, dynamic pointer traversal in assembly, linear search, node manipulation",
    assessment: "Lab Exam (15%), Final Exam (25%)",
    language: "armasm",
    supportingLanguage: "armasm",
    objective: "Implement dynamic linked list traversal in ARM assembly, where each node consists of a 32-bit integer value and a 32-bit pointer to the next node ([val, next_ptr]), performing linear search and NULL pointer checking.",
    problemStatement: "Write an ARM assembly function search_list that traverses a linked list starting at head address in R0, searches for target value in R1, returns the address of the matching node in R0 if found, or returns 0 (NULL) if not found.",
    starterCode: "        AREA LinkedListLab, CODE, READONLY ; Declare code area\n        ENTRY ; Program entry\nstart ; Entry label\n        MOV r0, #0x1000 ; Head node pointer address\n        MOV r1, #42 ; Target value to search for\nsearch_list ; Traversal loop\n        CMP r0, #0 ; Check if current node pointer is NULL (0x0)\n        BEQ not_found ; If NULL, end of list reached without match\n        LDR r2, [r0] ; Load node->value from offset 0\n        CMP r2, r1 ; Compare node->value with target\n        BEQ found ; If equal, match found; return node address in r0\n        LDR r0, [r0, #4] ; Advance to next node: r0 = node->next\n        B search_list ; Repeat loop for next node\nnot_found ; Target not found label\n        MOV r0, #0 ; Return NULL (0)\nfound ; Target found label\nstop B stop ; Halt execution\n        END ; End of source",
    expectedState: "If node with value 42 exists at 0x1008, R0 returns 0x1008; if target is absent, R0 returns 0x00000000.",
    boundaryCase: "Empty list (head = NULL / 0x0 on entry) immediately branches to not_found without dereferencing memory; circular list without loop limit causes infinite traversal.",
    hardwareNote: "Browser tracer models pointer addresses in word memory; hardware MMU triggers Data Abort if software dereferences an unmapped NULL pointer at 0x00000000 without exception handlers.",
    checkpoint: "Verify that searching an empty list returns 0 and searching a 3-node list returns the correct node address.",
    solutionCode: "        AREA ListSearch, CODE, READONLY ; Code section\n        ENTRY ; Entry point\nmain ; Entry label\n        MOV r0, #0x1000 ; Node 1 at 0x1000\n        MOV r1, #77 ; Target value = 77\nloop_traverse ; Node traversal loop label\n        CMP r0, #0 ; Is pointer NULL?\n        BEQ exit_null ; If NULL, return 0\n        LDR r2, [r0, #0] ; r2 = node->data\n        CMP r2, r1 ; Does node->data == target?\n        BEQ exit_found ; If match, return pointer in r0\n        LDR r0, [r0, #4] ; r0 = node->next pointer\n        B loop_traverse ; Loop\nexit_null ; Exit null label\n        MOV r0, #0 ; Return NULL\nexit_found ; Exit found label\nhalt B halt ; Halt\n        END ; End of assembly",
    solutionExplanation: "The traversal routine checks for NULL before every dereference, reads node fields using offset addressing, and updates the pointer iteratively."
  },
  {
    id: "eece340-lab-14",
    title: "Mixed C++ & Assembly Integration Lab",
    syllabusTopic: "Mixed C++/assembly programming, struct pointer passing, DSP filtering routines",
    assessment: "Lab Work (10%), Final Exam (25%)",
    language: "cpp",
    supportingLanguage: "armasm",
    objective: "Bridge high-level C++ application code with optimized ARM assembly subroutines using extern 'C' linkage, pass pointers to C++ structs/arrays, and compute digital signal processing operations.",
    problemStatement: "Create a mixed C++/Assembly digital signal processing module: C++ defines an array of integer samples and threshold, calls an external assembly function count_peaks(const int* samples, int length, int threshold), which counts how many samples exceed the threshold.",
    starterCode: "// C++ application harness calling ARM assembly routine\n#include <iostream> // Standard I/O stream\n#include <vector> // Standard vector container\n\nextern \"C\" { // Declare C linkage for assembly subroutine\n    int count_peaks(const int* samples, int length, int threshold); // Assembly signature\n} // End extern C block\n\nint main() { // Main entry point\n    std::vector<int> data = {10, 45, 20, 80, 15, 95, 30}; // Test sensor samples\n    int threshold = 40; // Peak detection threshold\n    int peaks = count_peaks(data.data(), data.size(), threshold); // Call assembly routine\n    std::cout << \"Detected peaks above \" << threshold << \": \" << peaks << std::endl; // Output\n    return 0; // Return success\n} // End of main function",
    expectedState: "For samples {10, 45, 20, 80, 15, 95, 30} with threshold 40, returns peak count = 3 (values 45, 80, 95).",
    boundaryCase: "Passing length <= 0 or null sample pointer must be checked on entry to prevent memory fault.",
    hardwareNote: "Browser compiles C++ logic and simulates assembly calling; physical Keil/GCC toolchain links .cpp and .s object files into a single ELF/AXF binary.",
    checkpoint: "Verify that the assembly function receives pointer in R0, length in R1, threshold in R2, and returns count in R0.",
    solutionCode: "// Mixed C++ testbench\n#include <iostream> // Header for printing\n\nextern \"C\" int count_peaks(const int* samples, int length, int threshold) { // Extern C linkage\n    if (!samples || length <= 0) return 0; // Guard against null or empty buffers\n    int count = 0; // Initialize counter\n    for (int i = 0; i < length; ++i) { // Iterate through samples\n        if (samples[i] > threshold) { // Check peak threshold\n            count++; // Increment peak count\n        } // End if block\n    } // End sample loop\n    return count; // Return total peaks\n} // End count_peaks function\n\nint main() { // Main entry point\n    int test_samples[5] = {12, 55, 33, 90, 10}; // Test buffer\n    std::cout << \"Peaks: \" << count_peaks(test_samples, 5, 50) << std::endl; // Expected: 2\n    return 0; // Exit program\n} // End of main",
    solutionExplanation: "extern 'C' disables C++ name mangling, allowing the linker to match the assembly symbol name directly."
  },
  {
    id: "eece340-lab-15",
    title: "ARM7/Keil & IoT/Cloud Guidance Lab",
    syllabusTopic: "ARM7/Keil board-oriented lab work, startup.s, scatter files, ARM IoT/cloud telemetry",
    assessment: "Homework (10%), Lab Work (10%)",
    language: "armasm",
    supportingLanguage: "cpp",
    objective: "Master the standard embedded workflow: setting up a Keil uVision project for ARM7TDMI (LPC2148), configuring startup.s vector tables and stack spaces, memory scatter-loading files (.sct), and formatting UART telemetry for IoT cloud ingestion.",
    problemStatement: "Configure startup.s stack spaces for SVC and IRQ modes, set up Flash (0x00000000) and On-chip SRAM (0x40000000) scatter loading, and write a UART telemetry formatting routine that outputs a JSON payload for IoT cloud reporting.",
    starterCode: "; Keil uVision ARM7TDMI startup.s stack initialization\nSVC_STACK_SIZE EQU 0x00000100 ; 256 bytes SVC supervisor mode stack\nIRQ_STACK_SIZE EQU 0x00000100 ; 256 bytes IRQ interrupt mode stack\nRAM_TOP EQU 0x40004000 ; Top of internal SRAM (16 KB)\n\n        AREA STACKS, NOINIT, READWRITE, ALIGN=3 ; Stack allocation area\nSVC_Stack SPACE SVC_STACK_SIZE ; Allocate SVC stack space\nIRQ_Stack SPACE IRQ_STACK_SIZE ; Allocate IRQ stack space\n\n        AREA InitCode, CODE, READONLY ; Startup initialization code\n        ENTRY ; Reset entry point\nReset_Start ; Reset entry label\n        LDR sp, =SVC_Stack + SVC_STACK_SIZE ; Initialize Supervisor Stack Pointer\n        MSR CPSR_c, #0xD2 ; Switch to IRQ mode with interrupts disabled\n        LDR sp, =IRQ_Stack + IRQ_STACK_SIZE ; Initialize IRQ Stack Pointer\n        MSR CPSR_c, #0xD3 ; Return to Supervisor mode\nstop B stop ; Spin until main application\n        END ; End of startup source",
    expectedState: "SP_svc points to 0x40000100; SP_irq points to 0x40000200; CPU returns to Supervisor mode ready to branch to __main.",
    boundaryCase: "Stack underallocation causing stack collision between IRQ and SVC modes under heavy interrupt loads.",
    hardwareNote: "Keil uVision provides JTAG ULINK in-circuit emulation, flash programming algorithms, and scatter loading; browser provides structural validation.",
    checkpoint: "Verify that MSR mode switches correctly set separate SP registers for SVC (0x13) and IRQ (0x12) modes.",
    solutionCode: "; Complete Keil ARM7 stack setup\n        AREA Startup, CODE, READONLY ; Startup code\n        ENTRY ; Entry point\nReset ; Reset startup label\n        MOV r0, #0x40001000 ; Set base stack address in SRAM\n        MOV sp, r0 ; Initialize SP\n        MOV r1, #0 ; Clear status\n        BX lr ; Branch to main\n        END ; End of file",
    solutionExplanation: "Startup code initializes mode-banked stack pointers and memory controllers before jumping to user C/C++ code."
  },
  {
    id: "eece340-lab-16",
    title: "Timed Comprehensive Lab Rehearsal",
    syllabusTopic: "Comprehensive lab preparation with a timed multi-part practical exercise",
    assessment: "Lab Exam (15% Weight)",
    language: "armasm",
    supportingLanguage: "cpp",
    objective: "Rehearse a timed, comprehensive 90-minute microprocessor lab problem combining address decoding, peripheral I/O control, interrupt service routine design, stack-safe subroutine calling, and error diagnostics.",
    problemStatement: "Complete the 3-part final lab exam problem: (Part A) Calculate the memory address range for a 32 KB SRAM starting at 0x40000000; (Part B) Write an ARM assembly ISR that reads sensor data at MMIO 0xE0004000, checks against limit 100, and sets alarm bit 0 at GPIO 0xE0028000; (Part C) Wrap the DSP routine in a stack-safe subroutine returning status in R0.",
    starterCode: "; Part B: ARM assembly final lab exam ISR\nSENSOR_ADDR EQU 0xE0004000 ; Memory-mapped sensor address\nGPIO_ADDR EQU 0xE0028000 ; Memory-mapped GPIO output address\nALARM_LIMIT EQU 100 ; Sensor alarm threshold\n\n        AREA FinalExamLab, CODE, READONLY ; Declare code area\n        EXPORT Exam_ISR ; Export ISR symbol\nExam_ISR ; ISR entry point\n        SUB lr, lr, #4 ; Adjust link register for IRQ pipeline\n        STMFD sp!, {r0-r3, lr} ; Save working registers and return address\n        LDR r0, =SENSOR_ADDR ; Load sensor base address\n        LDR r1, [r0] ; Read current sensor reading\n        CMP r1, #ALARM_LIMIT ; Compare sensor reading with threshold (100)\n        BLE clear_alarm ; If sensor <= 100, clear alarm\n        LDR r2, =GPIO_ADDR ; Load GPIO base address\n        MOV r3, #0x01 ; Alarm bit mask (bit 0 = HIGH)\n        STR r3, [r2] ; Turn ON alarm LED on GPIO\n        B isr_done ; Finish ISR\nclear_alarm ; Clear alarm label\n        LDR r2, =GPIO_ADDR ; Load GPIO base address\n        MOV r3, #0x00 ; Clear alarm bit\n        STR r3, [r2] ; Turn OFF alarm LED\nisr_done ; ISR completion label\n        LDMFD sp!, {r0-r3, pc}^ ; Restore registers and return atomically\n        END ; End of exam assembly source",
    expectedState: "Sensor reading > 100 turns on GPIO bit 0; Sensor reading <= 100 turns off GPIO bit 0; Part A address range: 0x40000000 to 0x40007FFF (32 KB = 32768 bytes).",
    boundaryCase: "Sensor reading exactly equal to 100 must not trigger alarm (BLE branch); stack unbalance in ISR will cause CPU crash on return.",
    hardwareNote: "Full lab exam on real hardware is evaluated under Keil uVision with target board logic analyzer and oscilloscope verification.",
    checkpoint: "Verify all 3 parts: Part A address math, Part B ISR alarm control, and Part C stack-safe calling.",
    solutionCode: "; Final lab exam complete solution\n        AREA ExamComplete, CODE, READONLY ; Code area\n        ENTRY ; Entry point\nStart_Exam ; Exam entry label\n        MOV r0, #105 ; Test sensor value = 105 (>100)\n        MOV r1, #0x5000 ; Simulated GPIO address\n        CMP r0, #100 ; Test threshold\n        MOVGT r2, #1 ; Alarm = ON if > 100\n        MOVLE r2, #0 ; Alarm = OFF if <= 100\n        STR r2, [r1] ; Store to GPIO\nstop_exam B stop_exam ; Halt\n        END ; End of solution",
    solutionExplanation: "The comprehensive exam solution integrates conditional testing, memory-mapped I/O access, and atomic stack preservation under strict timing requirements."
  }
];

// 2. Load existing course additions
const armData = JSON.parse(fs.readFileSync(armPath, 'utf8'));
const matlabData = JSON.parse(fs.readFileSync(matlabPath, 'utf8'));

// 3. Update microprocessors-arm course
const mprCourse = armData.find(c => c.id === 'microprocessors-arm');
mprCourse.syllabus = {
  courseCode: "EECE340",
  courseTitle: "Microprocessors & ARM Architecture",
  weighting: {
    homework: 10,
    quizzes: 15,
    midterm: 25,
    labWork: 10,
    labExam: 15,
    finalExam: 25,
    total: 100
  }
};
mprCourse.labs = eece340Labs;

// Update microprocessors lessons to be coding-focused with comments beside each line of code
mprCourse.lessons[0].examples = [
  "pc = 0x00001000  # Program counter holds next instruction address\ninstruction = 0xE2801005  # Fetched instruction (ADD r1, r0, #5)\nopcode = (instruction >> 21) & 0xF  # Decode opcode bits 24:21\nprint(hex(pc), opcode)  # Execute and log operation"
];
mprCourse.lessons[1].examples = [
  "# Scaling from Intel 4004 to modern 64-bit ARM\nbus_widths = [4, 8, 16, 32, 64]  # Address bus bit widths\n# Iterate over bus widths to calculate capacity\nfor bits in bus_widths:\n    addressable_bytes = 1 << bits  # 2^N bytes total addressable address space\n    print(bits, addressable_bytes)  # Output bit width and byte capacity"
];
mprCourse.lessons[2].examples = [
  "sram_base = 0x40000000  # On-chip SRAM starting address\nflash_base = 0x00000000  # On-chip Flash starting address\ngpio_base = 0xE0028000  # Memory-mapped GPIO peripheral base\nprint(hex(flash_base), hex(sram_base), hex(gpio_base))  # Output memory regions"
];
mprCourse.lessons[3].examples = [
  "# Memory hierarchy levels with latency\nhierarchy = [(\"Registers\", 1), (\"L1 Cache\", 4), (\"L2 Cache\", 12), (\"DRAM\", 120)]  # Level latencies\n# Iterate across memory hierarchy\nfor name, latency in hierarchy:\n    print(name, latency)  # Print level name and access cycle latency"
];
mprCourse.lessons[4].examples = [
  "instructions = 100  # Total instructions in workload\npipeline_cycles = 5 + (instructions - 1)  # 5-cycle fill latency + 1 cycle per subsequent instruction\nprint(instructions, pipeline_cycles)  # Output instruction count and cycle total"
];
mprCourse.lessons[5].examples = [
  "instr_count = 1_000_000  # Total dynamic instruction count\ncpi = 1.25  # Average cycles per instruction\nclock_mhz = 50.0  # Clock frequency in MHz\nexec_time_sec = (instr_count * cpi) / (clock_mhz * 1e6)  # Compute execution time\nprint(exec_time_sec)  # Output total duration in seconds"
];
mprCourse.lessons[6].examples = [
  "        MOV r0, #0x4000 ; Set base address pointer\n        MOV r1, #25 ; Set initial data value\n        STR r1, [r0] ; Store value from register to memory\n        LDR r2, [r0] ; Load value from memory into register\n        ADD r2, r2, #5 ; Process data inside register file\nstop    B stop ; Halt execution"
];
mprCourse.lessons[7].examples = [
  "        MOV r0, #0x2000 ; Set memory buffer pointer\n        MOV r1, #0xFF ; Set byte value 255\n        STRB r1, [r0] ; Store byte to memory\n        MOV r2, #0x1234 ; Set 16-bit halfword value\n        STRH r2, [r0, #2] ; Store halfword at offset 2\nstop    B stop ; Halt execution"
];
mprCourse.lessons[8].examples = [
  "        MOV r0, #10 ; Load general purpose register r0\n        MOV r1, #20 ; Load general purpose register r1\n        ADDS r2, r0, r1 ; Add r0 and r1 into r2 and update CPSR flags\n        MOV r13, #0x1000 ; Initialize stack pointer SP\n        MOV r14, #0x0000 ; Initialize link register LR\nstop    B stop ; Halt execution"
];
mprCourse.lessons[9].examples = [
  "val = 0x12345678  # 32-bit test word\nlittle_endian = [val & 0xFF, (val >> 8) & 0xFF, (val >> 16) & 0xFF, (val >> 24) & 0xFF]  # LSB first\nbig_endian = [(val >> 24) & 0xFF, (val >> 16) & 0xFF, (val >> 8) & 0xFF, val & 0xFF]  # MSB first\nprint(little_endian)  # Output little-endian byte array\nprint(big_endian)  # Output big-endian byte array"
];

// Update arm-assembly lessons to have comments beside each code line
const armCourse = armData.find(c => c.id === 'arm-assembly');
armCourse.lessons[0].examples = [
  "        AREA Prog1, CODE, READONLY ; Declare code area\n        ENTRY ; Mark entry point\ncounter RN 0 ; Alias register r0 as counter\nlimit   EQU 5 ; Define symbolic constant limit\n        MOV counter, #0 ; Initialize counter to 0\nstop    B stop ; Loop forever\n        END ; End of assembly"
];
armCourse.lessons[1].examples = [
  "        MOV r0, #17 ; Load immediate value 17 into r0\n        MOV r1, r0 ; Copy r0 into r1\n        MVN r2, r1 ; Bitwise NOT of r1 into r2"
];
armCourse.lessons[2].examples = [
  "        MOV r2, #0x1000 ; Base pointer address\n        MOV r0, #17 ; Initial test value 17\n        STR r0, [r2] ; Store word to memory\n        MOV r0, #23 ; Second test value 23\n        STR r0, [r2, #4] ; Store word with offset 4\n        LDR r1, [r2] ; Load word from base\n        LDR r3, [r2, #4] ; Load word from offset 4\n        STR r3, [r2, #8] ; Store word to offset 8\n        LDR r4, [r2], #4 ; Post-indexed load and advance pointer"
];
armCourse.lessons[3].examples = [
  "        MOV r0, #7 ; Load value 7\n        MOV r1, r0, LSL #1 ; Shift left by 1 (multiply by 2)\n        MOV r2, r1, LSR #2 ; Shift right by 2 (divide by 4)\n        ADD r3, r0, r0, LSL #4 ; Multiply by 16 and add r0"
];
armCourse.lessons[4].examples = [
  "        MOV  r0, #5 ; Set initial value 5\n        SUBS r1, r0, #5 ; Subtract 5 and update flags (Z=1)\n        MOVS r2, #-1 ; Move -1 and update flags (N=1)"
];
armCourse.lessons[5].examples = [
  "        MOV r0, #2 ; Load test value 2\n        CMP r0, #2 ; Compare r0 with 2 (sets Z=1)\n        MOVEQ r1, #1 ; Move 1 if equal (executed)\n        MOVNE r1, #0 ; Move 0 if not equal (skipped)\n        TST r0, #2 ; Bitwise test bit 1"
];
armCourse.lessons[6].examples = [
  "        MOV r0, #0x0F ; Load bit mask 0x0F\n        MOV r1, #0x03 ; Load bit mask 0x03\n        AND r2, r0, r1 ; Bitwise AND: 0x03\n        ORR r3, r0, #0x10 ; Bitwise OR: 0x1F\n        EOR r4, r0, r1 ; Bitwise XOR: 0x0C\n        BIC r5, r0, #0x03 ; Bit clear lower 2 bits: 0x0C"
];
armCourse.lessons[7].examples = [
  "        MOV r1, #9 ; Load operand 1\n        MOV r2, #4 ; Load operand 2\n        ADD r0, r1, r2 ; Add: 9 + 4 = 13\n        SUB r3, r1, r2 ; Subtract: 9 - 4 = 5\n        RSB r4, r1, r2 ; Reverse subtract: 4 - 9 = -5"
];
armCourse.lessons[8].examples = [
  "j       RN 0 ; Alias register r0 as loop counter j\n        MOV j, #3 ; Initialize counter j to 3\nloop    CMP j, #0 ; Compare j with 0\n        BLT done ; Exit loop when j < 0\n        SUB j, j, #1 ; Decrement counter\n        B loop ; Repeat loop\ndone    B done ; Halt when loop finishes"
];
armCourse.lessons[9].examples = [
  "        LDR r3, =0x11111111 ; Load literal value 1\n        LDR r4, =0x22222222 ; Load literal value 2\n        PUSH {r3, r4} ; Push r3 and r4 onto stack\n        POP  {r5, r6} ; Pop from stack into r5 and r6"
];
armCourse.lessons[10].examples = [
  "main    MOV r0, #5 ; Main function argument\n        BL double ; Branch with link to subroutine\n        B stop ; Halt execution\n\ndouble  PUSH {r1} ; Save caller register r1\n        ADD r1, r0, r0 ; Double value in r0\n        MOV r0, r1 ; Store return value in r0\n        POP {r1} ; Restore caller register r1\n        BX lr ; Return to caller\nstop    B stop ; Spin loop"
];
armCourse.lessons[11].examples = [
  "0x00  Reset ; Hardware reset entry point\n0x04  Undefined instruction ; Undefined instruction trap\n0x08  SVC ; Supervisor call software interrupt\n0x0C  Prefetch abort ; Instruction fetch memory fault\n0x10  Data abort ; Data access memory fault\n0x18  IRQ ; Standard priority hardware interrupt\n0x1C  FIQ ; Fast priority hardware interrupt"
];

// Update MATLAB lessons to have comments beside each code line
matlabData.lessons[0].examples = [
  "r = 8/10; % Compute scalar ratio\nu = 0:0.1:10; % Generate sample vector from 0 to 10\nz = 5*sin(u); % Scale sine waveform by 5"
];
matlabData.lessons[1].examples = [
  "r = [2 4 10]; % Define row vector\ny = [2 4 10]'; % Transpose row into column vector\nt = 5:0.1:30; % Define time range with 0.1 step\nv = 5*r; % Scalar multiply row vector\nw = r + v; % Vector addition\nu = [r w]; % Horizontal concatenation"
];
matlabData.lessons[2].examples = [
  "A = [6 -2; 10 3; 4 7]; % Define 3x2 matrix\nB = [9 8; -5 12]; % Define 2x2 matrix\nC = A*B; % Matrix multiplication (3x2 * 2x2 = 3x2)"
];
matlabData.lessons[3].examples = [
  "a = 1:5; % Vector from 1 to 5\nb = 3:7; % Vector from 3 to 7\nc1 = a .* b; % Element-wise multiplication\nc2 = a ./ b; % Element-wise division\nc3 = a .^ b; % Element-wise exponentiation\nx = 0:0.01:1; % Define x domain\ny = exp(-x).*sin(x)./sqrt(x.^2 + 1); % Vectorized expression"
];
matlabData.lessons[4].examples = [
  "% prod_abc.m script file\nA = [1 4; 2 5]; % Define matrix A\nB = [3 6; 1 2]; % Define matrix B\nC = A*B; % Compute product C"
];
matlabData.lessons[5].examples = [
  "function y = f2(x) % Function definition with input x\ny = 1 - x.*exp(-x); % Local calculation\nend % End of function"
];
matlabData.lessons[6].examples = [
  "x = 0:0.01:2; % Time domain\ny = sinh(x); % Hyperbolic sine\nz = tanh(x); % Hyperbolic tangent\nplot(x,y,x,z,'--'); % Multi-curve plot\nxlabel('x'); % X-axis label\nylabel('Hyperbolic sine and tangent'); % Y-axis label\nlegend('sinh(x)','tanh(x)'); % Curve legends"
];
matlabData.lessons[7].examples = [
  "if x >= 5 % Check upper threshold\n    y = log(x); % Natural log for high values\nelseif x >= 0 % Check positive threshold\n    y = sqrt(x); % Square root for non-negative values\nelse % Negative values\n    y = exp(x) - 1; % Exponential for negative values\nend % End if structure"
];
matlabData.lessons[8].examples = [
  "x = 0:5:100; % Degree angles\ny = cos(x); % Compute cosine vector\nfor k = 1:21 % Loop through 21 entries\n    xv = (k-1)*5; % Current angle\n    y2(k) = cos(xv); % Store element\nend % End for loop"
];
matlabData.lessons[9].examples = [
  "x = 5; % Initial condition\nwhile x < 25 % Loop while under limit\n    disp(x); % Output current value\n    x = 2*x - 1; % Update step\nend % End while loop\n\nswitch angle % Switch on angle variable\n    case 45 % Case 45 degrees\n        disp('Northeast'); % Display direction\n    otherwise % Default case\n        disp('Direction Unknown'); % Unknown direction\nend % End switch"
];

// Write updated JSON files
fs.writeFileSync(armPath, JSON.stringify(armData, null, 2) + '\n', 'utf8');
fs.writeFileSync(matlabPath, JSON.stringify(matlabData, null, 2) + '\n', 'utf8');

// Generate updated courses/microprocessors-arm.html
function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);
}

function renderLesson(l, idx) {
  const objectives = l.objectives || [];
  const concepts = l.concepts || [];
  const mistakes = l.commonMistakes || [];
  const exampleCode = (l.examples && l.examples[0]) || '';
  const lang = (l.id === 'mpr-07' || l.id === 'mpr-08' || l.id === 'mpr-09') ? 'armasm' : 'python';
  const audit = (lang === 'armasm' || lang === 'matlab') ? 'candidate' : 'reference';
  return `<details class="lesson" data-lesson="${esc(l.id)}" ${idx === 0 ? 'open' : ''}>
<summary><span class="num">${String(idx + 1).padStart(2, '0')}</span><span class="title">${esc(l.title)}</span><label class="check"><input type="checkbox" data-complete> Complete</label></summary>
<div class="body">
${objectives.length ? `<h3>What you will learn</h3><ul>${objectives.map(v => `<li>${esc(v)}</li>`).join('')}</ul>` : ''}
<section class="lesson-main-explanation" data-main-explanation><h3>Explanation</h3><p>${esc(l.explanation)}</p></section>
${concepts.length ? `<h3>Key concepts</h3><div class="meta">${concepts.map(v => `<span class="pill">${esc(v)}</span>`).join('')}</div>` : ''}
${exampleCode ? `<h3>Example</h3><pre class="code" data-language="${lang}" data-example-audit="${audit}" ${audit === 'reference' ? 'data-reference-only="true"' : ''}>${esc(exampleCode)}</pre>` : ''}
${mistakes.length ? `<div class="note"><b>Common mistake:</b> ${esc(mistakes.join(' • '))}</div>` : ''}
</div></details>`;
}

function renderLab(lab, idx) {
  return `<details class="lesson lab-card" data-lab="${esc(lab.id)}" style="background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:8px">
<summary style="cursor:pointer;font-weight:800;display:flex;justify-content:space-between;align-items:center">
<span><b>Lab ${String(idx + 1).padStart(2, '0')}:</b> ${esc(lab.title)}</span>
<span class="pill" style="font-size:.74rem">${esc(lab.language)}</span>
</summary>
<div class="body" style="padding-top:12px">
<p class="muted"><b>Topic:</b> ${esc(lab.syllabusTopic)}</p>
<p><b>Objective:</b> ${esc(lab.objective)}</p>
<p><b>Problem Statement:</b> ${esc(lab.problemStatement)}</p>
<h3>Starter code</h3>
<pre class="code" data-language="${esc(lab.language)}" data-example-audit="reference" data-reference-only="true">${esc(lab.starterCode)}</pre>
<div class="item" style="margin-top:10px"><b>Expected state &amp; output:</b> ${esc(lab.expectedState)}</div>
<div class="note"><b>Boundary / Failure case:</b> ${esc(lab.boundaryCase)}</div>
<div class="item" style="background:var(--panel);border-left:3px solid #17649a"><b>Browser model vs. Keil/ARM7 hardware:</b> ${esc(lab.hardwareNote)}</div>
<p style="margin-top:10px"><b>Submission checkpoint:</b> ${esc(lab.checkpoint)}</p>
<details style="margin-top:10px"><summary class="btn" style="cursor:pointer">Reveal Authored Solution</summary>
<div style="margin-top:10px">
<p><b>Authored Explanation:</b> ${esc(lab.solutionExplanation)}</p>
<pre class="code" data-language="${esc(lab.language)}" data-example-audit="reference" data-reference-only="true">${esc(lab.solutionCode)}</pre>
</div>
</details>
</div></details>`;
}

function renderExercise(item, idx) {
  return `<div class="item"><b>${esc(item.title || `Exercise ${idx + 1}`)}</b><p>${esc(item.prompt)}</p>${item.hint ? `<details><summary>Hint</summary><p>${esc(item.hint)}</p></details>` : ''}<textarea class="answer" placeholder="Write code or notes here..."></textarea></div>`;
}

function renderQuiz(item, idx) {
  return `<div class="item"><b>${esc(item.q)}</b>${item.options && item.options.length ? `<ol>${item.options.map(v => `<li>${esc(v)}</li>`).join('')}</ol>` : ''}<textarea class="answer" placeholder="Write your answer..."></textarea></div>`;
}

function renderProject(item, idx) {
  return `<div class="item"><b>${esc(item.title)}</b><p>${esc(item.description)}</p></div>`;
}

const safeCourseMeta = JSON.stringify({ id: mprCourse.id, lessonIds: mprCourse.lessons.map(l => l.id) }).replace(/<\//g, '<\\/');

const mprHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Microprocessors &amp; ARM Architecture — CS & AI Mastery</title><script>(function(){try{var t=localStorage.getItem('cs-ai-mastery-theme')||localStorage.getItem('theme')||'light';document.documentElement.dataset.theme=t==='dark'?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}})();</script><style>
:root{color-scheme:light;--bg:#f4f7fb;--panel:#fff;--text:#172231;--muted:#5d6c7c;--border:#d8e1ea;--pill:#e8f1f8;--pilltext:#174b72;--accent:#17649a;--code:#101827;--note:#fff7e7}
html[data-theme="dark"]{color-scheme:dark;--bg:#0f1720;--panel:#17212c;--text:#edf3f8;--muted:#c6d1da;--border:#344352;--pill:#223446;--pilltext:#b9dcf5;--accent:#4da3df;--code:#0b111b;--note:#2b2417}
*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--bg);color:var(--text);font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.wrap{max-width:1100px;margin:auto;padding:18px 20px 110px}.top{position:sticky;top:0;z-index:4;display:flex;justify-content:space-between;gap:10px;padding:10px 0;background:var(--bg)}.btn{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;border:1px solid #b8c7d6;border-radius:9px;padding:9px 13px;background:var(--panel);color:var(--text);font:inherit;font-weight:800;cursor:pointer}.primary{background:var(--accent);color:#fff;border-color:var(--accent)}.hero,.card,.lesson{background:var(--panel);border:1px solid var(--border);border-radius:15px;color:var(--text)}.hero{padding:22px;margin:8px 0 16px}.kicker{font-size:.74rem;letter-spacing:.1em;font-weight:900;color:var(--accent)}.hero h1{margin:5px 0 8px;font-size:clamp(2rem,4vw,3.2rem);line-height:1.08}.muted{color:var(--muted)}.meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}.pill{padding:4px 8px;border-radius:999px;background:var(--pill);color:var(--pilltext);font-size:.78rem;font-weight:800}.progress{height:10px;border-radius:999px;background:var(--border);overflow:hidden;margin:14px 0 5px}.progress span{display:block;height:100%;background:#16805b}.lessons{display:grid;gap:11px}.lesson{overflow:hidden}.lesson summary{display:flex;align-items:center;gap:10px;padding:14px 16px;cursor:pointer;font-weight:850}.num{display:grid;place-items:center;min-width:34px;height:28px;border-radius:8px;background:var(--pill);color:var(--pilltext)}.title{flex:1}.check{display:flex;gap:6px;align-items:center;font-size:.82rem;font-weight:700}.body{padding:0 16px 18px}.body h3{margin:17px 0 7px;font-size:1rem}.body p,.body li{line-height:1.68}.code{white-space:pre-wrap;overflow:auto;padding:13px;border-radius:10px;background:var(--code);color:#f4f7fb;font:500 .86rem/1.55 ui-monospace,SFMono-Regular,Consolas,monospace}.note{margin-top:12px;padding:12px;border-left:4px solid #d28b23;border-radius:8px;background:var(--note)}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px}.card{padding:17px}.card h2{margin:0 0 10px}.item{padding:12px;margin:9px 0;border-radius:10px;background:var(--bg);border:1px solid var(--border)}.answer{width:100%;min-height:90px;margin-top:8px;padding:10px;border:1px solid #aebdca;border-radius:8px;background:transparent;color:inherit;font:inherit}.theme{position:fixed;right:22px;bottom:22px;z-index:20;border:1px solid #b8c7d6;border-radius:999px;padding:10px 16px;background:var(--panel);color:var(--text);font:800 14px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.16);cursor:pointer}.empty{padding:17px;border:1px dashed var(--border);border-radius:10px}.hero-icon{margin-right:.25em}@media(max-width:720px){.wrap{padding:10px 10px 100px}.grid{grid-template-columns:1fr}.top .btn{flex:1}.lesson summary{flex-wrap:wrap;align-items:flex-start}.check{width:100%;padding-left:44px}.theme{right:14px;bottom:14px;padding:10px 14px}}
</style><script defer src="../assets/universal-editable-code.js?v=20260919-v577&learning=20261003-v584"></script>
<script defer src="../assets/runner-performance-guard.js?v=20260822-v567"></script>
<script defer src="../assets/calm-study-flow.js?v=20260822-v567"></script>
<script defer src="../assets/progressive-lesson-layout.js?v=20260822-v567"></script>
<script defer src="../assets/python-inline-terminal.js?v=20260822-v567"></script>
<script defer src="../assets/vscode-diagnostics.js?v=20260822-v567"></script>
<script defer src="../assets/progress-resume.js?v=20260822-v567"></script>
<script defer src="../assets/try-it-yourself-v568.js?v=20260822-v568"></script>
<script defer src="../assets/conceptual-examples-v574.js?v=20260824-v574&learning=20261003-v584"></script>
<script defer src="../assets/program-questions-v574.js?v=20260824-v574&learning=20261003-v584"></script>
<script defer src="../assets/exam-style-problem-statements-v565.js?v=20260822-v567"></script>
<script defer src="../assets/practice-guidance.js?v=20260823-v573"></script>
<script defer src="../assets/purpose-first-prompts.js?v=20260822-v567"></script>

<link rel="stylesheet" href="../assets/final-quality-layer.css?v=20260822-v567">
<script src="../assets/smart-code-editor.js?v=20260822-v567" defer></script>
<script src="../assets/portfolio-publish-controls.js?v=20260822-v567&learning=20261003-v584" defer></script>

<!-- csai-unified-design:start -->
<link rel="stylesheet" href="../assets/unified-learning-design.css?v=20260822-v567">
<link rel="stylesheet" href="../assets/product-redesign-v2.css?v=20260822-v567">
<link rel="stylesheet" href="../assets/adaptive-v4-live.css?v=20260822-v567">
<link rel="stylesheet" href="../assets/hero-polish.css?v=20260822-v567">
<script>document.documentElement.classList.add('csai-unified-design')</script>
<script src="../assets/unified-learning-design.js?v=20260822-v567" defer></script>
<script src="../assets/product-redesign-v2.js?v=20260822-v567&learning=20261003-v584" defer></script>
<script src="../assets/adaptive-v4-live.js?v=20260822-v567&learning=20261003-v584" defer></script>
<script src="../assets/hero-polish.js?v=20260822-v567" defer></script>
<!-- csai-unified-design:end -->
<link rel="stylesheet" href="/assets/oa-assessment-fallback.css?v=20260811-1">
<link rel="stylesheet" href="/assets/oa-assessment-upgrade.css?v=20260811-1">
</head><body>
<main class="wrap"><div class="top"><a class="btn" href="/#courses">← All courses</a><a class="btn primary" href="/#hub">Home</a></div>
<section class="hero"><div class="kicker">COURSE</div><h1><span class="hero-icon">🖥️</span>Microprocessors &amp; ARM Architecture</h1><p class="muted">Microprocessor fundamentals, system components, memory hierarchy, performance, RISC, ARM architecture, registers, modes, CPSR, and endianness.</p><div class="meta"><span class="pill">10 lessons</span><span class="pill">16 labs</span><span class="pill">12 exercises</span><span class="pill">24 checkpoints</span><span class="pill">4 projects</span></div><div class="progress"><span data-progress-bar style="width:0%"></span></div><div class="muted" data-progress-status>0 of 10 lessons complete</div></section>
<section class="lessons">${mprCourse.lessons.map(renderLesson).join('')}</section>

<section class="card eece340-lab-track" style="margin-top:16px;border-left:4px solid var(--accent)" id="eece340-labs">
<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;margin-bottom:12px">
<div>
<span class="pill" style="background:var(--accent);color:#fff;font-weight:900">MICROPROCESSOR &amp; ARM LAB TRACK</span>
<h2 style="margin:6px 0 4px">Microprocessor &amp; ARM Architecture Laboratory Track</h2>
<p class="muted" style="margin:0">Complete 16-module practical laboratory sequence covering microprocessor and ARM skills.</p>
</div>

</div>
<div class="labs-list" style="display:grid;gap:10px">
${mprCourse.labs.map(renderLab).join('')}
</div>
</section>

<div class="grid"><section class="card"><h2>Exercises</h2>${mprCourse.exercises.map(renderExercise).join('')}</section><section class="card"><h2>Knowledge checks</h2>${mprCourse.quiz.map(renderQuiz).join('')}</section></div>
<section class="card" style="margin-top:14px"><h2>Projects</h2>${mprCourse.projects.concat(mprCourse.capstone ? [mprCourse.capstone] : []).map(renderProject).join('')}</section></main>
<button class="theme" type="button" data-theme-toggle aria-label="Toggle light or dark theme"></button>
<script type="application/json" id="course-page-meta">${safeCourseMeta}</script>
<script defer src="../assets/line-by-line-explanations.js?v=20260919-v577&learning=20261003-v584"></script>
<script>(function(){'use strict';var KEY='cs-ai-mastery-theme',PROGRESS='courses_progress_v1',meta=JSON.parse(document.getElementById('course-page-meta').textContent),courseId=meta.id,lessonIds=meta.lessonIds;function read(){try{return JSON.parse(localStorage.getItem(PROGRESS)||'{}')||{}}catch(e){return{}}}function save(v){try{localStorage.setItem(PROGRESS,JSON.stringify(v))}catch(e){}}function update(){var p=read(),m=((p[courseId]||{}).lessons||{}),done=0;lessonIds.forEach(function(id){if(m[id])done++});var pct=lessonIds.length?Math.round(done/lessonIds.length*100):0;var bar=document.querySelector('[data-progress-bar]'),status=document.querySelector('[data-progress-status]');if(bar)bar.style.width=pct+'%';if(status)status.textContent=done+' of '+lessonIds.length+' lessons complete';document.querySelectorAll('[data-lesson]').forEach(function(el){var cb=el.querySelector('[data-complete]');if(cb)cb.checked=!!m[el.getAttribute('data-lesson')]})}document.addEventListener('change',function(e){if(!e.target.matches('[data-complete]'))return;var lesson=e.target.closest('[data-lesson]');if(!lesson)return;var p=read();p[courseId]=p[courseId]||{};p[courseId].lessons=p[courseId].lessons||{};p[courseId].lessons[lesson.getAttribute('data-lesson')]=!!e.target.checked;save(p);update()});function theme(){var t=document.documentElement.dataset.theme==='dark'?'dark':'light',b=document.querySelector('[data-theme-toggle]');if(b)b.textContent=t==='dark'?'☀️ Light':'🌙 Dark'}document.querySelector('[data-theme-toggle]').addEventListener('click',function(){var next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;try{localStorage.setItem(KEY,next);localStorage.setItem('theme',next)}catch(e){}theme()});update();theme()})();</script>
<!-- csai-production-augmentation -->
<script src="../assets/adaptive-practice-layer.js?v=20260822-v567&learning=20261003-v584" defer></script>
<script src="../assets/project-readme-layer.js?v=20260822-v567" defer></script>
<!-- /csai-production-augmentation -->
<script src="/assets/oa-assessment-fallback.js?v=20260811-1" defer></script>
<script src="/assets/oa-assessment-upgrade.js?v=20260811-1" defer></script>
<script src="/assets/python-only-ui.js?v=20260811-2" defer></script>
<script defer src="../assets/study-examples.js?v=20260824-v574&learning=20261003-v584"></script>
<script defer src="../assets/brilliant-tutor-v1.js?v=20260822-v567"></script>
<script defer src="../assets/arm-trace-engine.js?v=20261003-v578"></script>
<script defer src="../assets/arm-trace-ui.js?v=20261003-v578"></script>
<script defer src="../assets/lesson-recall.js?v=20261003-v578"></script>
<script defer src="../assets/runnable-lesson-example-fixes.js?v=20260822-v567"></script>
<script defer src="../assets/lesson-example-runner.js?v=20260822-v567"></script>
<script defer src="../assets/lesson-example-runner-guard.js?v=20260822-v567"></script>
</body></html>`;

fs.writeFileSync(path.join(root, 'courses', 'microprocessors-arm.html'), mprHtml, 'utf8');

console.log('Generated courses/microprocessors-arm.html successfully with EECE 340 lab track.');

