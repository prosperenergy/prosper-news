import Foundation
import LinkPresentation
import AppKit

guard CommandLine.arguments.count == 3, let target = URL(string: CommandLine.arguments[1]) else {
    fatalError("Usage: swift check-apple-preview.swift https://url output-prefix")
}
let outputPrefix = CommandLine.arguments[2]
let provider = LPMetadataProvider()
provider.timeout = 30
var finished = false
var exitCode: Int32 = 1
func record(_ payload: [String: Any]) {
    if let data = try? JSONSerialization.data(withJSONObject: payload, options: [.prettyPrinted, .sortedKeys]),
       let text = String(data: data, encoding: .utf8) {
        print(text)
        try? data.write(to: URL(fileURLWithPath: outputPrefix + ".json"))
    }
}
provider.startFetchingMetadata(for: target) { metadata, error in
    guard let metadata = metadata else {
        record(["url": target.absoluteString, "passed": false, "error": error?.localizedDescription ?? "No metadata"])
        finished = true
        return
    }
    var result: [String: Any] = ["url": target.absoluteString, "resolvedURL": metadata.url?.absoluteString ?? "", "title": metadata.title ?? "", "imageTypes": metadata.imageProvider?.registeredTypeIdentifiers ?? [], "iconAvailable": metadata.iconProvider != nil]
    guard let imageProvider = metadata.imageProvider, imageProvider.canLoadObject(ofClass: NSImage.self) else {
        result["passed"] = false
        result["error"] = "Apple returned no loadable preview image"
        record(result)
        finished = true
        return
    }
    imageProvider.loadObject(ofClass: NSImage.self) { object, error in
        if let image = object as? NSImage, let tiff = image.tiffRepresentation, let bitmap = NSBitmapImageRep(data: tiff), let png = bitmap.representation(using: .png, properties: [:]) {
            try? png.write(to: URL(fileURLWithPath: outputPrefix + ".png"))
            result["imageWidth"] = bitmap.pixelsWide
            result["imageHeight"] = bitmap.pixelsHigh
            result["imageFile"] = outputPrefix + ".png"
            result["passed"] = true
            exitCode = 0
        } else {
            result["passed"] = false
            result["error"] = error?.localizedDescription ?? "Preview image could not be decoded"
        }
        record(result)
        finished = true
    }
}
let deadline = Date(timeIntervalSinceNow: 50)
while !finished && Date() < deadline {
    RunLoop.current.run(until: Date(timeIntervalSinceNow: 0.1))
}
if !finished { provider.cancel(); record(["url":target.absoluteString,"passed":false,"error":"Native preview check timed out"]); }
exit(exitCode)
