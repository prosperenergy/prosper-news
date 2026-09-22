import Foundation
import AVFoundation
import AppKit

let files = Array(CommandLine.arguments.dropFirst())
let output = URL(fileURLWithPath: FileManager.default.currentDirectoryPath).appendingPathComponent("outputs/clip-review")
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
var rows: [[String: Any]] = []
for file in files {
    let url = URL(fileURLWithPath: file)
    let asset = AVURLAsset(url: url)
    let seconds = CMTimeGetSeconds(asset.duration)
    let tracks = asset.tracks(withMediaType: .video)
    let generator = AVAssetImageGenerator(asset: asset)
    generator.appliesPreferredTrackTransform = true
    generator.maximumSize = CGSize(width: 380, height: 600)
    let times = [0.15, seconds * 0.25, seconds * 0.5, seconds * 0.75, max(0, seconds - 0.25)]
    var frames: [String] = []
    let strip = NSImage(size: NSSize(width: 1900, height: 640))
    strip.lockFocus()
    NSColor.black.setFill()
    NSRect(x: 0, y: 0, width: 1900, height: 640).fill()
    for (i, second) in times.enumerated() {
        do {
            let cg = try generator.copyCGImage(at: CMTime(seconds: second, preferredTimescale: 600), actualTime: nil)
            let image = NSImage(cgImage: cg, size: .zero)
            let bitmap = NSBitmapImageRep(cgImage: cg)
            let frameURL = output.appendingPathComponent(url.deletingPathExtension().lastPathComponent + "-\(i).png")
            try bitmap.representation(using: .png, properties: [:])!.write(to: frameURL)
            frames.append(frameURL.path)
            let ratio = min(360 / CGFloat(cg.width), 590 / CGFloat(cg.height))
            let width = CGFloat(cg.width) * ratio
            let height = CGFloat(cg.height) * ratio
            image.draw(in: NSRect(x: CGFloat(i) * 380 + (380-width)/2, y: 36+(590-height)/2, width: width, height: height))
            let label = NSString(string: String(format: "%.2f sec",second))
            label.draw(at: NSPoint(x:CGFloat(i)*380+18,y:10), withAttributes:[.font:NSFont.systemFont(ofSize:17),.foregroundColor:NSColor.white])
        } catch { print("Could not inspect frame \(second): \(error.localizedDescription)") }
    }
    strip.unlockFocus()
    let contactURL = output.appendingPathComponent(url.deletingPathExtension().lastPathComponent+"-contact.png")
    if let tiff=strip.tiffRepresentation,let bitmap=NSBitmapImageRep(data:tiff),let png=bitmap.representation(using:.png,properties:[:]){try png.write(to:contactURL)}
    rows.append(["file":file,"seconds":seconds,"videoTracks":tracks.count,"audioTracks":asset.tracks(withMediaType:.audio).count,"naturalWidth":tracks.first?.naturalSize.width ?? 0,"naturalHeight":tracks.first?.naturalSize.height ?? 0,"frames":frames,"contactSheet":contactURL.path])
}
let data=try JSONSerialization.data(withJSONObject:rows,options:[.prettyPrinted,.sortedKeys])
try data.write(to:output.appendingPathComponent("inventory.json"))
print(String(data:data,encoding:.utf8)!)
