# Module 1 — Part A: Computing Foundations
## Chapter 4: Files, Folders & File Systems Demystified

---

## SECTION 1 — LEARNING OBJECTIVES

```
Chapter:          [Module 1] [Part A] — Chapter 4: Files, Folders & File Systems
Estimated time:   35 minutes theory + 15 minutes hands-on lab = 50 minutes
Prerequisites:    Chapter 3: Operating Systems Explained
```

**Learning Objectives:**
- Explain what a file system does and why it's required to use a storage device
- Describe how files are structured internally (inodes, metadata, data blocks)
- Compare the most common file systems (NTFS, ext4, APFS, FAT32) and their use cases
- Navigate and inspect file system metadata from the command line

**Chapter bridge:** This chapter explains the filing system the OS from Chapter 3 manages on the storage hardware from Chapter 1. It leads directly into Chapter 5 (The Command Line) — because navigating the file system is the primary thing the command line does.

---

## SECTION 2 — SPARK

Every file on your computer — a Word document, an MP3, a database — is just a sequence of bytes on a disk. But the disk itself is just a flat sequence of storage blocks, numbered 0, 1, 2, 3... all the way to the last block. There are no folders. There are no filenames. There's just block 0, block 1, block 2...

So who creates the illusion of folders and filenames? Who decides that the bytes starting at block 42,857 are your resume, and the bytes starting at block 891,203 are your music? Who tracks that when you "delete" a file, those blocks are now available for reuse?

The answer is the file system — and it's more sophisticated than most engineers realize. When a file system fails or corrupts, you don't just "lose files." You can lose the entire structure that maps filenames to locations, making every byte on the disk inaccessible even though the data is physically still there. Understanding this has saved terabytes of data — and misunderstanding it has cost companies their entire databases.

---

## SECTION 3 — WHY THIS MATTERS

Every cloud storage service — AWS S3, Azure Blob Storage, Google Cloud Storage — is an abstraction built on top of file systems running on physical disks. Every Docker container has a layered file system. Every database stores its data in files managed by the OS file system. When you configure log rotation, set up disk quotas, mount an NFS share, or troubleshoot "disk full" errors (even when `df` says there's space), you're dealing with file system mechanics. Engineers who understand file systems debug these problems in minutes. Engineers who don't spend hours on Stack Overflow.

---

## SECTION 4 — CORE THEORY

---

### 1. What a File System Actually Does — The Phone Book for Your Disk

Raw storage is a flat array of blocks — typically 4KB each on modern systems. A 1TB drive has approximately 268 million blocks, all numbered sequentially. A file system is the **index** that maps human-readable filenames and folder structures to these numbered blocks.

The file system maintains:
- **A directory structure** — the tree of folders and filenames
- **Metadata per file** — size, creation time, modification time, owner, permissions
- **A block allocation map** — which blocks are free, which are in use
- **Data integrity structures** — checksums or journals to recover from crashes

When you "create a file," the OS: (1) finds free blocks in the allocation map, (2) writes your data to those blocks, (3) creates an entry in the directory with the filename, (4) creates a metadata record linking the filename to those blocks. When you "delete" a file, the OS typically just removes the directory entry and marks those blocks as free — the data is still physically on disk until overwritten. This is why "deleted" files can often be recovered, and why you need secure deletion for sensitive data.

> **Real example: GitLab Database Deletion, January 2017.** A GitLab engineer accidentally ran `rm -rf` (remove recursively, force) on the wrong database server — the production PostgreSQL database directory instead of a staging one. The command deleted the database files at the file system level. GitLab had multiple backup systems, but found that: (1) the primary backup hadn't worked for 6 months, (2) a second backup contained no data, (3) a third was 24 hours stale. They ultimately recovered from a 6-hour-old database snapshot — losing 6 hours of user data. One file system command, one wrong directory, one catastrophic production incident, live-streamed to 5,000 viewers. The lesson: understand what file system operations are destructive and irreversible.

---

### 2. Inodes — The Hidden Metadata Layer

On Unix/Linux file systems (ext4, APFS, XFS), every file is represented by an **inode** (index node) — a fixed-size data structure stored in a special inode table on disk. The inode contains:

- File size
- Owner and group (UID, GID)
- Permissions
- Timestamps (created, modified, accessed)
- Pointer(s) to the actual data blocks

Crucially: **inodes do not contain the filename.** The filename exists in the directory entry, which maps a name to an inode number. This separation is why you can have **hard links** — two different filenames pointing to the same inode (same actual data). Deleting one filename doesn't delete the data — only when all filenames pointing to an inode are deleted does the data get freed.

This also explains a confusing production scenario: **"disk full" even when `df` shows free space.** Linux has a finite number of inodes (set at format time). A system that creates millions of tiny files (like mail servers, logging systems, or certain databases) can exhaust all available inodes while still having disk space — because it runs out of inode slots, not data blocks. `df -i` shows inode usage separately.

> **Real example: Fastmail Inode Exhaustion, 2013.** Fastmail, an email hosting provider, suffered an outage because a server ran out of inodes. The email system was creating one file per email — millions of small files over time — and eventually consumed every available inode. New emails couldn't be written even though disk space was available. They had to emergency-migrate data to a new file system with more inodes. This type of failure is impossible to understand without knowing what inodes are.

---

### 3. File System Types — Choosing the Right Container

Not all file systems are equal. Each makes different tradeoffs between compatibility, performance, reliability, and features:

**FAT32 / exFAT:**
- Maximum file size: 4GB (FAT32) / unlimited (exFAT)
- No permissions, no journaling
- Why it exists: maximum compatibility — every OS reads it
- Use case: USB drives, memory cards, cross-platform file transfer
- Why not for servers: no permissions, prone to corruption, no recovery on crash

**NTFS (Windows default):**
- Supports: large files, ACL permissions, encryption, journaling
- Journaling: logs changes before writing — on crash, can replay the log to recover
- Use case: Windows system drives, Windows servers
- Cross-platform: Linux can read NTFS, write is limited without drivers

**ext4 (Linux default):**
- Supports: large files, POSIX permissions, journaling, extended attributes
- Extremely stable — Linux servers run on ext4 for years without issues
- Use case: virtually all Linux servers and cloud instances
- Limitation: not designed for SSDs specifically (btrfs, XFS are often preferred for high-performance workloads)

**APFS (macOS/iOS):**
- Designed specifically for SSDs and flash storage
- Supports: snapshots, clones, encryption, space sharing between volumes
- Snapshots: captures the state of the entire file system at a point in time — copy-on-write means it's near-instant and space-efficient

**Ask yourself:** Why would you format a production database server's disk with ext4 instead of NTFS even if your company primarily uses Windows?

> **Real example: Facebook's Haystack, 2010.** Facebook built their own custom storage system called Haystack specifically to avoid POSIX file system overhead. Traditional file systems require metadata lookups (inodes) for every file access — when Facebook serves billions of photos daily, the metadata operations alone were a bottleneck. Haystack stores multiple photos in a single large file, bypassing the per-file inode overhead. This is an example of engineers understanding file system internals deeply enough to design around them.

---

### 4. Mounting — How File Systems Become Accessible

On Linux, a storage device (USB drive, NFS share, cloud disk) doesn't automatically become accessible when plugged in. It must be **mounted** — attached to a directory in the existing file system tree.

The root file system starts at `/`. Mounting a USB drive at `/mnt/usb` means: "make the files on this USB drive accessible at the path `/mnt/usb/`." From that point, `ls /mnt/usb` lists the USB drive's contents.

Cloud storage works the same way. An AWS EBS volume attached to an EC2 instance must be formatted and mounted before it can be used. An NFS (Network File System) share mounts a remote directory into your local file system tree as if it were local.

`/etc/fstab` is the configuration file that defines what gets mounted automatically at boot — editing it incorrectly can prevent the system from booting. This is one of the most common "I bricked my server" scenarios for new Linux administrators.

---

## SECTION 5 — THEORY CHECKPOINT

```
Quick Check:

1. What is an inode, and why is it stored separately from the filename?

2. A production server shows "No space left on device" error, but 
   `df -h` shows 40% disk space free. What is the likely cause?

3. In the GitLab incident, the engineer deleted the database directory 
   with `rm -rf`. Why couldn't the data be recovered from the disk 
   itself after the deletion?

(Answers in Key Takeaways)
```

---

## SECTION 6 — HANDS-ON LAB

```
Lab: Inspect File System Metadata From the Terminal
Platform:         Windows, macOS, Linux
Tools needed:     Built-in terminal only
Estimated time:   15 minutes
What you'll demonstrate: Files have hidden metadata beyond their visible 
                  contents — understanding it is a daily cloud ops skill.
```

**Step 1: Check disk usage and file system info**

**Linux/macOS:**
```bash
df -h
```
Shows mounted file systems, their sizes, used/available space. `-h` = human readable (GB).

```bash
df -i
```
Shows inode usage — check if you're approaching inode exhaustion.

**Windows:**
```powershell
Get-PSDrive -PSProvider FileSystem
```

**Step 2: Inspect file metadata (inodes on Linux/macOS)**

**Linux/macOS:**
```bash
stat ~/Desktop
```
Or for a specific file:
```bash
touch /tmp/testfile.txt
stat /tmp/testfile.txt
```
You'll see: inode number, number of hard links, file permissions, owner, size, timestamps.

**Windows:**
```powershell
Get-Item C:\Users\$env:USERNAME\Desktop | Select-Object *
```

**Step 3: Check inode number**

```bash
ls -li /tmp/testfile.txt
```
The number before permissions is the inode number. Try creating a hard link:

```bash
ln /tmp/testfile.txt /tmp/testfile_hardlink.txt
ls -li /tmp/testfile.txt /tmp/testfile_hardlink.txt
```
**Both files have the same inode number** — they point to the same data. Delete one, the data survives.

**Step 4: Find which file system type you're on**

**Linux:**
```bash
df -T /
```
Or:
```bash
findmnt /
```

**macOS:**
```bash
diskutil info / | grep "Type"
```

**Step 5: Inspect a directory's size (not just its contents)**

```bash
du -sh ~/Documents
```
`du` = disk usage, `-s` = summary, `-h` = human readable. This shows the actual disk space consumed, not just listed file sizes (which can differ due to sparse files and compression).

```
Lab reflection:
You've seen that filenames and file data are stored separately (inodes), 
and that "disk full" can happen through two completely different mechanisms 
(data blocks OR inodes).

Now think about this: when Docker containers share a base image layer, 
how does the container avoid duplicating gigabytes of data for each 
running container? 

Hint: it relates to the copy-on-write concept mentioned in APFS. 
Chapter 21 (Containers vs VMs) answers this directly.
```

---

## SECTION 7 — QUIZ

```
Quiz — Chapter 4

1. What information does an inode store, and what notably does it NOT store?

2. Why can deleted files often be recovered from a disk? What would 
   need to happen to make recovery impossible?

3. In the GitLab January 2017 incident, six hours of user data was 
   permanently lost. What does this reveal about the relationship 
   between file system operations and backup strategy?

4. You run `df -h` on a Linux server and see / is at 23% usage. 
   But when you try to create a new file, you get "No space left 
   on device." What command would you run next to diagnose the issue, 
   and what are you looking for?

5. True/False: "Formatting a USB drive with exFAT instead of NTFS 
   is always the wrong choice because exFAT has fewer features."
   Explain your answer.
```

---

## SECTION 8 — KEY TAKEAWAYS

- **A file system is an index mapping filenames to disk blocks.** Raw storage has no concept of files — the file system creates that abstraction. Corrupt the file system, and all data becomes inaccessible even if physically intact.
- **Inodes are the metadata layer below filenames.** They store permissions, timestamps, size, and block pointers — but not the name. This is why hard links work, and why inode exhaustion can fill a "disk" with space remaining.
- **"Deleting" a file removes the directory entry, not the data.** Data survives until blocks are overwritten. Secure deletion requires overwriting. Recovery tools exploit this for forensics.
- **File system choice is a tradeoff.** FAT32 = compatibility, no features. NTFS = Windows features. ext4 = Linux reliability. APFS = SSD-optimized with snapshots. No single file system is best for all use cases.
- **Real incidents (GitLab deletion 2017, Fastmail inode exhaustion 2013) trace back to these fundamentals** — not mysterious storage failures, just file system mechanics under operational pressure.

---

## SECTION 9 — ANSWER KEY (INSTRUCTOR ONLY)

**Q1:** Inodes store: file size, owner/group, permissions, timestamps, and pointers to data blocks. They do NOT store the filename — that's stored in the directory entry. This separation enables hard links and efficient directory operations.

**Q2:** Deletion typically only removes the directory entry and marks blocks as free in the allocation bitmap. The actual bytes remain on disk until those blocks are allocated and overwritten for new data. Secure deletion requires explicitly overwriting the blocks with zeros or random data (e.g., `shred` on Linux).

**Q3:** The GitLab incident shows that file system operations like `rm -rf` are immediate, atomic, and have no built-in undo. The file system doesn't "check" if you really meant it. The only protection is external backup systems — and they must be regularly tested. Backups that have never been restored are assumptions, not guarantees.

**Q4:** Run `df -i` — this shows inode usage. If inodes are at or near 100%, the system is inode-exhausted. Look for a filesystem with `IUse%` near 100% while disk space is available. Fix: delete small files, compress log files, or migrate to a file system formatted with more inodes.

**Q5:** False — it depends on the use case. exFAT is actually the *correct* choice for USB drives and memory cards used across multiple operating systems (Windows, Mac, Linux, cameras, TVs), because it has near-universal compatibility. NTFS's features (permissions, journaling) are valuable on Windows system drives but irrelevant for a portable drive. Using NTFS on a USB drive means macOS can't write to it natively. Tool selection depends on requirements.

---

## SECTION 10 — LEARNING RESOURCES

**📹 Videos**
- **"File Systems as Fast as Possible" — Techquickie** — Quick, clear coverage of FAT32/NTFS/ext4 comparisons
- **"How Files are Stored on a Hard Drive" — Branch Education** — Visual breakdown of disk sectors, file allocation
- **"Linux File System Explained" — DorianDotSlash** — Covers the Linux directory tree and mount points clearly

**📖 Articles**
- **Red Hat: "An introduction to Linux filesystems"** — Thorough technical overview of ext4, XFS, btrfs
- **Julia Evans: "How to recover a deleted file"** — Excellent post explaining inode recovery mechanics
- **GitLab Post-Mortem Blog** — The official GitLab write-up of the 2017 database deletion — read the full timeline

**🔗 Practice**
- **Linux: `man hier`** — Run this in any Linux terminal. Shows the standard Linux directory tree with explanations — essential reference.
