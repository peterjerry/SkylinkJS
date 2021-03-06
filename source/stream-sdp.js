/**
 * Function that modifies the session description to configure settings for OPUS audio codec.
 * @method _setSDPCodecParams
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._setSDPCodecParams = function(targetMid, sessionDescription) {
  var self = this;

  var parseFn = function (type, codecName, samplingRate, settings) {
    var mLine = sessionDescription.sdp.match(new RegExp('m=' + type + '\ .*\r\n', 'gi'));
    // Find the m= line
    if (Array.isArray(mLine) && mLine.length > 0) {
      var codecsList = sessionDescription.sdp.match(new RegExp('a=rtpmap:.*\ ' + codecName + '\/' +
        (samplingRate ? samplingRate + (type === 'audio' ? '[\/]*.*' : '.*') : '.*') + '\r\n', 'gi'));
      // Get the list of codecs related to it
      if (Array.isArray(codecsList) && codecsList.length > 0) {
        for (var i = 0; i < codecsList.length; i++) {
          var payload = (codecsList[i].split('a=rtpmap:')[1] || '').split(' ')[0];
          if (!payload) {
            continue;
          }
          var fmtpLine = sessionDescription.sdp.match(new RegExp('a=fmtp:' + payload + '\ .*\r\n', 'gi'));
          var updatedFmtpLine = 'a=fmtp:' + payload + ' ';
          var addedKeys = [];
          // Check if a=fmtp: line exists
          if (Array.isArray(fmtpLine) && fmtpLine.length > 0) {
            var fmtpParts = (fmtpLine[0].split('a=fmtp:' + payload + ' ')[1] || '').replace(
              / /g, '').replace(/\r\n/g, '').split(';');
            for (var j = 0; j < fmtpParts.length; j++) {
              if (!fmtpParts[j]) {
                continue;
              }
              var keyAndValue = fmtpParts[j].split('=');
              if (settings.hasOwnProperty(keyAndValue[0])) {
                // Dont append parameter key+value if boolean and false
                updatedFmtpLine += typeof settings[keyAndValue[0]] === 'boolean' ? (settings[keyAndValue[0]] ?
                  keyAndValue[0] + '=1;' : '') : keyAndValue[0] + '=' + settings[keyAndValue[0]] + ';';
              } else {
                updatedFmtpLine += fmtpParts[j] + ';';
              }
              addedKeys.push(keyAndValue[0]);
            }
            sessionDescription.sdp = sessionDescription.sdp.replace(fmtpLine[0], '');
          }
          for (var key in settings) {
            if (settings.hasOwnProperty(key) && addedKeys.indexOf(key) === -1) {
              // Dont append parameter key+value if boolean and false
              updatedFmtpLine += typeof settings[key] === 'boolean' ? (settings[key] ? key + '=1;' : '') :
                key + '=' + settings[key] + ';';
              addedKeys.push(key);
            }
          }
          if (updatedFmtpLine !== 'a=fmtp:' + payload + ' ') {
            sessionDescription.sdp = sessionDescription.sdp.replace(codecsList[i], codecsList[i] + updatedFmtpLine + '\r\n');
          }
        }
      }
    }
  };

  // Set audio codecs -> OPUS
  // RFC: https://tools.ietf.org/html/draft-ietf-payload-rtp-opus-11
  parseFn('audio', self.AUDIO_CODEC.OPUS, 48000, (function () {
    var opusOptions = {};
    var audioSettings = self.getPeerInfo().settings.audio;
    audioSettings = audioSettings && typeof audioSettings === 'object' ? audioSettings : {};
    if (typeof self._codecParams.audio.opus.stereo === 'boolean') {
      opusOptions.stereo = self._codecParams.audio.opus.stereo;
    } else if (typeof audioSettings.stereo === 'boolean') {
      opusOptions.stereo = audioSettings.stereo;
    }
    if (typeof self._codecParams.audio.opus.usedtx === 'boolean') {
      opusOptions.usedtx = self._codecParams.audio.opus.usedtx;
    } else if (typeof audioSettings.usedtx === 'boolean') {
      opusOptions.usedtx = audioSettings.usedtx;
    }
    if (typeof self._codecParams.audio.opus.useinbandfec === 'boolean') {
      opusOptions.useinbandfec = self._codecParams.audio.opus.useinbandfec;
    } else if (typeof audioSettings.useinbandfec === 'boolean') {
      opusOptions.useinbandfec = audioSettings.useinbandfec;
    }
    if (typeof self._codecParams.audio.opus.maxplaybackrate === 'number') {
      opusOptions.maxplaybackrate = self._codecParams.audio.opus.maxplaybackrate;
    } else if (typeof audioSettings.maxplaybackrate === 'number') {
      opusOptions.maxplaybackrate = audioSettings.maxplaybackrate;
    }
    if (typeof self._codecParams.audio.opus.minptime === 'number') {
      opusOptions.minptime = self._codecParams.audio.opus.minptime;
    } else if (typeof audioSettings.minptime === 'number') {
      opusOptions.minptime = audioSettings.minptime;
    }
    // Possible future params: sprop-maxcapturerate, maxaveragebitrate, sprop-stereo, cbr
    // NOT recommended: maxptime, ptime, rate, minptime
    return opusOptions;
  })());

  // RFC: https://tools.ietf.org/html/rfc4733
  // Future: Set telephone-event: 100 0-15,66,70

  // RFC: https://tools.ietf.org/html/draft-ietf-payload-vp8-17
  // Set video codecs -> VP8
  parseFn('video', self.VIDEO_CODEC.VP8, null, (function () {
    var vp8Options = {};
    // NOT recommended: max-fr, max-fs (all are codec decoder capabilities)
    if (typeof self._codecParams.video.vp8.maxFr === 'number') {
      vp8Options['max-fr'] = self._codecParams.video.vp8.maxFr;
    }
    if (typeof self._codecParams.video.vp8.maxFs === 'number') {
      vp8Options['max-fs'] = self._codecParams.video.vp8.maxFs;
    }
    return vp8Options;
  })());

  // RFC: https://tools.ietf.org/html/draft-ietf-payload-vp9-02
  // Set video codecs -> VP9
  parseFn('video', self.VIDEO_CODEC.VP9, null, (function () {
    var vp9Options = {};
    // NOT recommended: max-fr, max-fs (all are codec decoder capabilities)
    if (typeof self._codecParams.video.vp9.maxFr === 'number') {
      vp9Options['max-fr'] = self._codecParams.video.vp9.maxFr;
    }
    if (typeof self._codecParams.video.vp9.maxFs === 'number') {
      vp9Options['max-fs'] = self._codecParams.video.vp9.maxFs;
    }
    return vp9Options;
  })());

  // RFC: https://tools.ietf.org/html/rfc6184
  // Set the video codecs -> H264
  parseFn('video', self.VIDEO_CODEC.H264, null, (function () {
    var h264Options = {};
    if (typeof self._codecParams.video.h264.levelAsymmetryAllowed === 'string') {
      h264Options['profile-level-id'] = self._codecParams.video.h264.profileLevelId;
    }
    if (typeof self._codecParams.video.h264.levelAsymmetryAllowed === 'boolean') {
      h264Options['level-asymmetry-allowed'] = self._codecParams.video.h264.levelAsymmetryAllowed;
    }
    if (typeof self._codecParams.video.h264.packetizationMode === 'boolean') {
      h264Options['packetization-mode'] = self._codecParams.video.h264.packetizationMode;
    }
    // Possible future params (remove if they are decoder/encoder capabilities or info):
    //   max-recv-level, max-mbps, max-smbps, max-fs, max-cpb, max-dpb, max-br,
    //   max-mbps, max-smbps, max-fs, max-cpb, max-dpb, max-br, redundant-pic-cap, sprop-parameter-sets,
    //   sprop-level-parameter-sets, use-level-src-parameter-sets, in-band-parameter-sets,
    //   sprop-interleaving-depth, sprop-deint-buf-req, deint-buf-cap, sprop-init-buf-time,
    //   sprop-max-don-diff, max-rcmd-nalu-size, sar-understood, sar-supported
    //   NOT recommended: profile-level-id (WebRTC uses "42e00a" for the moment)
    //   https://bugs.chromium.org/p/chromium/issues/detail?id=645599
    return h264Options;
  })());

  return sessionDescription.sdp;
};

/**
 * Function that modifies the session description to limit the maximum sending bandwidth.
 * Setting this may not necessarily work in Firefox.
 * @method _setSDPBitrate
 * @private
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype._setSDPBitrate = function(targetMid, sessionDescription) {
  var sdpLines = sessionDescription.sdp.split('\r\n');
  var parseFn = function (type, bw) {
    var mLineType = type;
    var mLineIndex = -1;
    var cLineIndex = -1;

    if (type === 'data') {
      mLineType = 'application';
    }

    for (var i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].indexOf('m=' + mLineType) === 0) {
        mLineIndex = i;
      } else if (mLineIndex > 0) {
        if (sdpLines[i].indexOf('m=') === 0) {
          break;
        }

        if (sdpLines[i].indexOf('c=') === 0) {
          cLineIndex = i;
        // Remove previous b:AS settings
        } else if (sdpLines[i].indexOf('b=AS:') === 0 || sdpLines[i].indexOf('b:TIAS:') === 0) {
          sdpLines.splice(i, 1);
          i--;
        }
      }
    }

    if (!(typeof bw === 'number' && bw > 0)) {
      log.warn([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Not limiting "' + type + '" bandwidth']);
      return;
    }

    if (cLineIndex === -1) {
      log.error([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Failed setting "' +
        type + '" bandwidth as c-line is missing.']);
      return;
    }

    // Follow RFC 4566, that the b-line should follow after c-line.
    log.info([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Limiting maximum sending "' + type + '" bandwidth ->'], bw);
    sdpLines.splice(cLineIndex + 1, 0, window.webrtcDetectedBrowser === 'firefox' ? 'b=TIAS:' + (bw * 1024) : 'b=AS:' + bw);
  };

  var bASAudioBw = this._streamsBandwidthSettings.bAS.audio;
  var bASVideoBw = this._streamsBandwidthSettings.bAS.video;
  var bASDataBw = this._streamsBandwidthSettings.bAS.data;
  var googleXMinBw = this._streamsBandwidthSettings.googleX.min;
  var googleXMaxBw = this._streamsBandwidthSettings.googleX.max;

  if (this._peerCustomConfigs[targetMid]) {
    if (this._peerCustomConfigs[targetMid].bandwidth &&
      typeof this._peerCustomConfigs[targetMid].bandwidth === 'object') {
      if (typeof this._peerCustomConfigs[targetMid].bandwidth.audio === 'number') {
        bASAudioBw = this._peerCustomConfigs[targetMid].bandwidth.audio;
      }
      if (typeof this._peerCustomConfigs[targetMid].bandwidth.video === 'number') {
        bASVideoBw = this._peerCustomConfigs[targetMid].bandwidth.video;
      }
      if (typeof this._peerCustomConfigs[targetMid].bandwidth.data === 'number') {
        bASDataBw = this._peerCustomConfigs[targetMid].bandwidth.data;
      }
    }
    if (this._peerCustomConfigs[targetMid].googleXBandwidth &&
      typeof this._peerCustomConfigs[targetMid].googleXBandwidth === 'object') {
      if (typeof this._peerCustomConfigs[targetMid].googleXBandwidth.min === 'number') {
        googleXMinBw = this._peerCustomConfigs[targetMid].googleXBandwidth.min;
      }
      if (typeof this._peerCustomConfigs[targetMid].googleXBandwidth.max === 'number') {
        googleXMaxBw = this._peerCustomConfigs[targetMid].googleXBandwidth.max;
      }
    }
  }

  parseFn('audio', bASAudioBw);
  parseFn('video', bASVideoBw);
  parseFn('data', bASDataBw);

  // Sets the experimental google bandwidth
  if ((typeof googleXMinBw === 'number') || (typeof googleXMaxBw === 'number')) {
    var codec = null;
    var codecRtpMapLineIndex = -1;
    var codecFmtpLineIndex = -1;

    for (var j = 0; j < sdpLines.length; j++) {
      if (sdpLines[j].indexOf('m=video') === 0) {
        codec = sdpLines[j].split(' ')[3];
      } else if (codec) {
        if (sdpLines[j].indexOf('m=') === 0) {
          break;
        }

        if (sdpLines[j].indexOf('a=rtpmap:' + codec + ' ') === 0) {
          codecRtpMapLineIndex = j;
        } else if (sdpLines[j].indexOf('a=fmtp:' + codec + ' ') === 0) {
          sdpLines[j] = sdpLines[j].replace(/x-google-(min|max)-bitrate=[0-9]*[;]*/gi, '');
          codecFmtpLineIndex = j;
          break;
        }
      }
    }

    if (codecRtpMapLineIndex > -1) {
      var xGoogleParams = '';

      if (typeof googleXMinBw === 'number') {
        xGoogleParams += 'x-google-min-bitrate=' + googleXMinBw + ';';
      }

      if (typeof googleXMaxBw === 'number') {
        xGoogleParams += 'x-google-max-bitrate=' + googleXMaxBw + ';';
      }

      log.info([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Limiting x-google-bitrate ->'], xGoogleParams);

      if (codecFmtpLineIndex > -1) {
        sdpLines[codecFmtpLineIndex] += (sdpLines[codecFmtpLineIndex].split(' ')[1] ? ';' : '') + xGoogleParams;
      } else {
        sdpLines.splice(codecRtpMapLineIndex + 1, 0, 'a=fmtp:' + codec + ' ' + xGoogleParams);
      }
    }
  }

  return sdpLines.join('\r\n');
};

/**
 * Function that modifies the session description to set the preferred audio/video codec.
 * @method _setSDPCodec
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._setSDPCodec = function(targetMid, sessionDescription, overrideSettings) {
  var self = this;
  var parseFn = function (type, codecSettings) {
    var codec = typeof codecSettings === 'object' ? codecSettings.codec : codecSettings;
    var samplingRate = typeof codecSettings === 'object' ? codecSettings.samplingRate : null;
    var channels = typeof codecSettings === 'object' ? codecSettings.channels : null;

    if (codec === self[type === 'audio' ? 'AUDIO_CODEC' : 'VIDEO_CODEC'].AUTO) {
      log.warn([targetMid, 'RTCSessionDesription', sessionDescription.type,
        'Not preferring any codec for "' + type + '" streaming. Using browser selection.']);
      return;
    }

    var mLine = sessionDescription.sdp.match(new RegExp('m=' + type + ' .*\r\n', 'gi'));

    if (!(Array.isArray(mLine) && mLine.length > 0)) {
      log.error([targetMid, 'RTCSessionDesription', sessionDescription.type,
        'Not preferring any codec for "' + type + '" streaming as m= line is not found.']);
      return;
    }

    var setLineFn = function (codecsList, isSROk, isChnlsOk) {
      if (Array.isArray(codecsList) && codecsList.length > 0) {
        if (!isSROk) {
          samplingRate = null;
        }
        if (!isChnlsOk) {
          channels = null;
        }
        log.info([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Preferring "' +
          codec + '" (samplingRate: ' + (samplingRate || 'n/a') + ', channels: ' +
          (channels || 'n/a') + ') for "' + type + '" streaming.']);

        var line = mLine[0];
        var lineParts = line.replace('\r\n', '').split(' ');
        // Set the m=x x UDP/xxx
        line = lineParts[0] + ' ' + lineParts[1] + ' ' + lineParts[2] + ' ';
        // Remove them to leave the codecs only
        lineParts.splice(0, 3);
        // Loop for the codecs list to append first
        for (var i = 0; i < codecsList.length; i++) {
          var parts = (codecsList[i].split('a=rtpmap:')[1] || '').split(' ');
          if (parts.length < 2) {
            continue;
          }
          line += parts[0] + ' ';
        }
        // Loop for later fallback codecs to append
        for (var j = 0; j < lineParts.length; j++) {
          if (line.indexOf(' ' + lineParts[j]) > 0) {
            lineParts.splice(j, 1);
            j--;
          } else if (sessionDescription.sdp.match(new RegExp('a=rtpmap:' + lineParts[j] +
            '\ ' + codec + '/.*\r\n', 'gi'))) {
            line += lineParts[j] + ' ';
            lineParts.splice(j, 1);
            j--;
          }
        }
        // Append the rest of the codecs
        line += lineParts.join(' ') + '\r\n';
        sessionDescription.sdp = sessionDescription.sdp.replace(mLine[0], line);
        return true;
      }
    };

    // If samplingRate & channels
    if (samplingRate) {
      if (type === 'audio' && channels && setLineFn(sessionDescription.sdp.match(new RegExp('a=rtpmap:.*\ ' +
        codec + '\/' + samplingRate + (channels === 1 ? '[\/1]*' : '\/' + channels) + '\r\n', 'gi')), true, true)) {
        return;
      } else if (setLineFn(sessionDescription.sdp.match(new RegExp('a=rtpmap:.*\ ' + codec + '\/' +
        samplingRate + '[\/]*.*\r\n', 'gi')), true)) {
        return;
      }
    }
    if (type === 'audio' && channels && setLineFn(sessionDescription.sdp.match(new RegExp('a=rtpmap:.*\ ' +
      codec + '\/.*\/' + channels + '\r\n', 'gi')), false, true)) {
      return;
    }

    setLineFn(sessionDescription.sdp.match(new RegExp('a=rtpmap:.*\ ' + codec + '\/.*\r\n', 'gi')));
  };

  parseFn('audio', overrideSettings ? overrideSettings.audio : self._selectedAudioCodec);
  parseFn('video', overrideSettings ? overrideSettings.video : self._selectedVideoCodec);

  return sessionDescription.sdp;
};

/**
 * Function that modifies the session description to remove the previous experimental H264
 * codec that is apparently breaking connections.
 * NOTE: We should perhaps not remove it since H264 is supported?
 * @method _removeSDPFirefoxH264Pref
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._removeSDPFirefoxH264Pref = function(targetMid, sessionDescription) {
  log.info([targetMid, 'RTCSessionDesription', sessionDescription.type,
    'Removing Firefox experimental H264 flag to ensure interopability reliability']);

  return sessionDescription.sdp.replace(/a=fmtp:0 profile-level-id=0x42e00c;packetization-mode=1\r\n/g, '');
};

/**
 * Function that modifies the session description to append the MediaStream and MediaStreamTrack IDs that seems
 * to be missing from Firefox answer session description to Chrome connection causing freezes in re-negotiation.
 * @method _addSDPMediaStreamTrackIDs
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._addSDPMediaStreamTrackIDs = function (targetMid, sessionDescription) {
  if (!(this._peerConnections[targetMid] && this._peerConnections[targetMid].getLocalStreams().length > 0)) {
    log.log([targetMid, 'RTCSessionDesription', sessionDescription.type,
      'Not enforcing MediaStream IDs as no Streams is sent.']);
    return sessionDescription.sdp;
  }

  var sessionDescriptionStr = sessionDescription.sdp;

  if (!this._enableIceTrickle) {
    sessionDescriptionStr = sessionDescriptionStr.replace(/a=end-of-candidates\r\n/g, '');
  }

  var sdpLines = sessionDescriptionStr.split('\r\n');
  var agent = ((this._peerInformations[targetMid] || {}).agent || {}).name || '';
  var localStream = this._peerConnections[targetMid].getLocalStreams()[0];
  var localStreamId = localStream.id || localStream.label;

  var parseFn = function (type, tracks) {
    if (tracks.length === 0) {
      log.log([targetMid, 'RTCSessionDesription', sessionDescription.type,
        'Not enforcing "' + type + '" MediaStreamTrack IDs as no Stream "' + type + '" tracks is sent.']);
      return;
    }

    var trackId = tracks[0].id || tracks[0].label;
    var trackLabel = tracks[0].label || 'Default';
    var ssrcId = null;
    var hasReachedType = false;

    // Get SSRC ID
    for (var i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].indexOf('m=' + type) === 0) {
        if (!hasReachedType) {
          hasReachedType = true;
          continue;
        } else {
          break;
        }
      }

      if (hasReachedType && sdpLines[i].indexOf('a=ssrc:') === 0) {
        if (!ssrcId) {
          ssrcId = (sdpLines[i].split(':')[1] || '').split(' ')[0] || null;
        }

        if (ssrcId && sdpLines[i].indexOf('a=ssrc:' + ssrcId + ' ') === 0) {
          if (sdpLines[i].indexOf(' cname:') > 0) {
            log.info([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Updating MediaStreamTrack ssrc (' +
              ssrcId + ') for "' + localStreamId + '" stream and "' + trackId + '" (label:"' + trackLabel + '")']);
            sdpLines.splice(i + 1, 0,
              'a=ssrc:' + ssrcId + ' msid:' + localStreamId + ' ' + trackId,
              'a=ssrc:' + ssrcId + ' mslabel:' + trackId,
              'a=ssrc:' + ssrcId + ' label:' + trackId);
            i += 3;
          } else {
            sdpLines.splice(i, 1);
            i--;
          }
        }
        break;
      }
    }
  };

  parseFn('audio', localStream.getAudioTracks());
  parseFn('video', localStream.getVideoTracks());

  // Append signaling of end-of-candidates
  if (!this._enableIceTrickle){
    log.info([targetMid, 'RTCSessionDesription', sessionDescription.type,
      'Appending end-of-candidates signal for non-trickle ICE connection.']);
    for (var i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].indexOf('a=candidate:') === 0) {
        if (sdpLines[i + 1] ? !(sdpLines[i + 1].indexOf('a=candidate:') === 0 ||
          sdpLines[i + 1].indexOf('a=end-of-candidates') === 0) : true) {
          sdpLines.splice(i + 1, 0, 'a=end-of-candidates');
          i++;
        }
      }
    }
  }

  if (sessionDescription.type === this.HANDSHAKE_PROGRESS.ANSWER && this._sdpSessions[targetMid]) {
    var bundleLineIndex = -1;
    var mLineIndex = -1;

    for (var j = 0; j < sdpLines.length; j++) {
      if (sdpLines[j].indexOf('a=group:BUNDLE') === 0 && this._sdpSessions[targetMid].remote.bundleLine &&
        this._peerConnectionConfig.bundlePolicy === this.BUNDLE_POLICY.MAX_BUNDLE) {
        sdpLines[j] = this._sdpSessions[targetMid].remote.bundleLine;
      } else if (sdpLines[j].indexOf('m=') === 0) {
        mLineIndex++;
        var compareA = sdpLines[j].split(' ');
        var compareB = (this._sdpSessions[targetMid].remote.mLines[mLineIndex] || '').split(' ');

        if (compareA[0] && compareB[0] && compareA[0] !== compareB[0]) {
          compareB[1] = 0;
          log.info([targetMid, 'RTCSessionDesription', sessionDescription.type,
            'Appending middle rejected m= line ->'], compareB.join(' '));
          sdpLines.splice(j, 0, compareB.join(' '));
          j++;
          mLineIndex++;
        }
      }
    }

    while (this._sdpSessions[targetMid].remote.mLines[mLineIndex + 1]) {
      mLineIndex++;
      var appendIndex = sdpLines.length;
      if (!sdpLines[appendIndex - 1].replace(/\s/gi, '')) {
        appendIndex -= 1;
      }
      var parts = (this._sdpSessions[targetMid].remote.mLines[mLineIndex] || '').split(' ');
      parts[1] = 0;
      log.info([targetMid, 'RTCSessionDesription', sessionDescription.type,
        'Appending later rejected m= line ->'], parts.join(' '));
      sdpLines.splice(appendIndex, 0, parts.join(' '));
    }
  }

  if (window.webrtcDetectedBrowser === 'edge' && sessionDescription.type === this.HANDSHAKE_PROGRESS.OFFER &&
    !sdpLines[sdpLines.length - 1].replace(/\s/gi, '')) {
    log.info([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Removing last empty space for Edge browsers']);
    sdpLines.splice(sdpLines.length - 1, 1);
  }

  var outputStr = sdpLines.join('\r\n');

  /*if (window.webrtcDetectedBrowser === 'edge' && this._streams.userMedia && this._streams.userMedia.stream) {
    var correctStreamId = this._streams.userMedia.stream.id || this._streams.userMedia.stream.label;
    outputStr = outputStr.replace(new RegExp('a=msid:.*\ ', 'gi'), 'a=msid:' + correctStreamId + ' ');
    outputStr = outputStr.replace(new RegExp('\ msid:.*\ ', 'gi'), ' msid:' + correctStreamId + ' ');
  }*/

  return outputStr;
};

/**
 * Function that modifies the session description to remove apt/rtx lines that does exists.
 * @method _removeSDPUnknownAptRtx
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._removeSDPUnknownAptRtx = function (targetMid, sessionDescription) {
  var codecsPayload = []; // Payload numbers as the keys
  var sdpLines = sessionDescription.sdp.split('\r\n');
  var hasVideo = false;
  var rtxs = {};
  var parts = [];

  // Remove rtx or apt= lines that prevent connections for browsers without VP8 or VP9 support
  // See: https://bugs.chromium.org/p/webrtc/issues/detail?id=3962
  for (var i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].indexOf('m=') === 0) {
      if (hasVideo) {
        for (var r in rtxs) {
          if (rtxs.hasOwnProperty(r) && rtxs[r] && codecsPayload.indexOf(rtxs[r].codec) === -1) {
            for (var l = 0; l < rtxs[r].lines.length; l++) {
              sdpLines.splice(sdpLines.indexOf(rtxs[r].lines[l]), 1);
              i--;
            }
          }
        }
      }
      hasVideo = sdpLines[i].indexOf('m=video ') === 0;
      codecsPayload = [];
      rtxs = {};
    }
    if (sdpLines[i].toLowerCase().indexOf('a=rtpmap:') === 0) {
      parts = (sdpLines[i].split('a=rtpmap:')[1] || '').split(' ');
      if (parts[1].toLowerCase().indexOf('rtx') === 0) {
        if (!rtxs[parts[0]]) {
          rtxs[parts[0]] = { lines:[], codec: null };
        }
        rtxs[parts[0]].lines.push(sdpLines[i]);
      } else {
        codecsPayload.push(parts[0]);
      }
    } else if (sdpLines[i].indexOf('a=fmtp:') === 0 && sdpLines[i].indexOf(' apt=') > 0) {
      parts = (sdpLines[i].split('a=fmtp:')[1] || '').split(' ');
      if (parts[0] && !rtxs[parts[0]]) {
        rtxs[parts[0]] = { lines:[], codec: null };
      }
      rtxs[parts[0]].codec = parts[1].split('apt=')[1];
      rtxs[parts[0]].lines.push(sdpLines[i]);
    }
  }

  return sdpLines.join('\r\n');
};

/**
 * Function that modifies the session description to remove codecs.
 * @method _removeSDPCodecs
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._removeSDPCodecs = function (targetMid, sessionDescription) {
  var audioSettings = this.getPeerInfo().settings.audio;

  var parseFn = function (type, codec) {
    var payloadList = sessionDescription.sdp.match(new RegExp('a=rtpmap:(\\d*)\\ ' + codec + '.*', 'gi'));

    if (!(Array.isArray(payloadList) && payloadList.length > 0)) {
      log.warn([targetMid, 'RTCSessionDesription', sessionDescription.type,
        'Not removing "' + codec + '" as it does not exists.']);
      return;
    }

    for (var i = 0; i < payloadList.length; i++) {
      var payload = payloadList[i].split(' ')[0].split(':')[1];

      log.info([targetMid, 'RTCSessionDesription', sessionDescription.type,
        'Removing "' + codec + '" payload ->'], payload);

      sessionDescription.sdp = sessionDescription.sdp.replace(
        new RegExp('a=rtpmap:' + payload + '\\ .*\\r\\n', 'g'), '');
      sessionDescription.sdp = sessionDescription.sdp.replace(
        new RegExp('a=fmtp:' + payload + '\\ .*\\r\\n', 'g'), '');
      sessionDescription.sdp = sessionDescription.sdp.replace(
        new RegExp('a=rtpmap:\\d+ rtx\\/\\d+\\r\\na=fmtp:\\d+ apt=' + payload + '\\r\\n', 'g'), '');

      // Remove the m-line codec
      var sdpLines = sessionDescription.sdp.split('\r\n');

      for (var j = 0; j < sdpLines.length; j++) {
        if (sdpLines[j].indexOf('m=' + type) === 0) {
          var parts = sdpLines[j].split(' ');

          if (parts.indexOf(payload) >= 3) {
            parts.splice(parts.indexOf(payload), 1);
          }

          sdpLines[j] = parts.join(' ');
          break;
        }
      }

      sessionDescription.sdp = sdpLines.join('\r\n');
    }
  };

  if (this._disableVideoFecCodecs) {
    if (this._hasMCU) {
      log.warn([targetMid, 'RTCSessionDesription', sessionDescription.type,
        'Not removing "ulpfec" or "red" codecs as connected to MCU to prevent connectivity issues.']);
    } else {
      parseFn('video', 'red');
      parseFn('video', 'ulpfec');
    }
  }

  if (this._disableComfortNoiseCodec && audioSettings && typeof audioSettings === 'object' && audioSettings.stereo) {
    parseFn('audio', 'CN');
  }

  if (window.webrtcDetectedBrowser === 'edge' &&
    (((this._peerInformations[targetMid] || {}).agent || {}).name || 'unknown').name !== 'edge') {
    sessionDescription.sdp = sessionDescription.sdp.replace(/a=rtcp-fb:.*\ x-message\ .*\r\n/gi, '');
  }

  return sessionDescription.sdp;
};

/**
 * Function that modifies the session description to remove REMB packets fb.
 * @method _removeSDPREMBPackets
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._removeSDPREMBPackets = function (targetMid, sessionDescription) {
  if (!this._disableREMB) {
    return sessionDescription.sdp;
  }

  log.info([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Removing REMB packets.']);
  return sessionDescription.sdp.replace(/a=rtcp-fb:\d+ goog-remb\r\n/g, '');
};

/**
 * Function that retrieves the session description selected codec.
 * @method _getSDPSelectedCodec
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._getSDPSelectedCodec = function (targetMid, sessionDescription, type, beSilentOnLogs) {
  if (!(sessionDescription && sessionDescription.sdp)) {
    return null;
  }

  var sdpLines = sessionDescription.sdp.split('\r\n');
  var selectedCodecInfo = {
    name: null,
    implementation: null,
    clockRate: null,
    channels: null,
    payloadType: null,
    params: null
  };

  for (var i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].indexOf('m=' + type) === 0) {
      var parts = sdpLines[i].split(' ');

      if (parts.length < 4) {
        break;
      }

      selectedCodecInfo.payloadType = parseInt(parts[3], 10);

    } else if (selectedCodecInfo.payloadType !== null) {
      if (sdpLines[i].indexOf('m=') === 0) {
        break;
      }

      if (sdpLines[i].indexOf('a=rtpmap:' + selectedCodecInfo.payloadType + ' ') === 0) {
        var params = (sdpLines[i].split(' ')[1] || '').split('/');
        selectedCodecInfo.name = params[0] || '';
        selectedCodecInfo.clockRate = params[1] ? parseInt(params[1], 10) : null;
        selectedCodecInfo.channels = params[2] ? parseInt(params[2], 10) : null;

      } else if (sdpLines[i].indexOf('a=fmtp:' + selectedCodecInfo.payloadType + ' ') === 0) {
        selectedCodecInfo.params = sdpLines[i].split('a=fmtp:' + selectedCodecInfo.payloadType + ' ')[1] || null;
      }
    }
  }

  if (!beSilentOnLogs) {
    log.debug([targetMid, 'RTCSessionDesription', sessionDescription.type,
      'Parsing session description "' + type + '" codecs ->'], selectedCodecInfo);
  }

  return selectedCodecInfo;
};

/**
 * Function that modifies the session description to remove non-relay ICE candidates.
 * @method _removeSDPFilteredCandidates
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._removeSDPFilteredCandidates = function (targetMid, sessionDescription) {
  // Handle Firefox MCU Peer ICE candidates
  if (targetMid === 'MCU' && sessionDescription.type === this.HANDSHAKE_PROGRESS.ANSWER &&
    window.webrtcDetectedBrowser === 'firefox') {
    sessionDescription.sdp = sessionDescription.sdp.replace(/ generation 0/g, '');
    sessionDescription.sdp = sessionDescription.sdp.replace(/ udp /g, ' UDP ');
  }

  if (this._forceTURN && this._hasMCU) {
    log.warn([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Not filtering ICE candidates as ' +
      'TURN connections are enforced as MCU is present (and act as a TURN itself) so filtering of ICE candidate ' +
      'flags are not honoured']);
    return sessionDescription.sdp;
  }

  if (this._filterCandidatesType.host) {
    log.info([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Removing "host" ICE candidates.']);
    sessionDescription.sdp = sessionDescription.sdp.replace(/a=candidate:.*host.*\r\n/g, '');
  }

  if (this._filterCandidatesType.srflx) {
    log.info([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Removing "srflx" ICE candidates.']);
    sessionDescription.sdp = sessionDescription.sdp.replace(/a=candidate:.*srflx.*\r\n/g, '');
  }

  if (this._filterCandidatesType.relay) {
    log.info([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Removing "relay" ICE candidates.']);
    sessionDescription.sdp = sessionDescription.sdp.replace(/a=candidate:.*relay.*\r\n/g, '');
  }

  // sessionDescription.sdp = sessionDescription.sdp.replace(/a=candidate:(?!.*relay.*).*\r\n/g, '');

  return sessionDescription.sdp;
};

/**
 * Function that retrieves the current list of support codecs.
 * @method _getCodecsSupport
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._getCodecsSupport = function (callback) {
  var self = this;

  if (self._currentCodecSupport) {
    callback(null);
  }

  self._currentCodecSupport = { audio: {}, video: {} };

  try {
    if (window.webrtcDetectedBrowser === 'edge') {
      var codecs = RTCRtpSender.getCapabilities().codecs;

      for (var i = 0; i < codecs.length; i++) {
        if (['audio','video'].indexOf(codecs[i].kind) > -1 && codecs[i].name) {
          var codec = codecs[i].name.toLowerCase();
          self._currentCodecSupport[codecs[i].kind][codec] = codecs[i].clockRate +
            (codecs[i].numChannels > 1 ? '/' + codecs[i].numChannels : '');
        }
      }
      // Ignore .fecMechanisms for now
      callback(null);

    } else {
      var pc = new RTCPeerConnection(null);
      var offerConstraints = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      };

      if (['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1) {
        offerConstraints = {
          mandatory: {
            OfferToReceiveVideo: true,
            OfferToReceiveAudio: true
          }
        };
      }

      // Prevent errors and proceed with create offer still...
      try {
        var channel = pc.createDataChannel('test');
        self._binaryChunkType = channel.binaryType || self._binaryChunkType;
        self._binaryChunkType = self._binaryChunkType.toLowerCase().indexOf('array') > -1 ?
          self.DATA_TRANSFER_DATA_TYPE.ARRAY_BUFFER : self._binaryChunkType;
        // Set the value according to the property
        for (var prop in self.DATA_TRANSFER_DATA_TYPE) {
          if (self.DATA_TRANSFER_DATA_TYPE.hasOwnProperty(prop) &&
            self._binaryChunkType.toLowerCase() === self.DATA_TRANSFER_DATA_TYPE[prop].toLowerCase()) {
            self._binaryChunkType = self.DATA_TRANSFER_DATA_TYPE[prop];
            break;
          }
        }
      } catch (e) {}

      pc.createOffer(function (offer) {
        var sdpLines = offer.sdp.split('\r\n');
        var mediaType = '';

        for (var i = 0; i < sdpLines.length; i++) {
          if (sdpLines[i].indexOf('m=') === 0) {
            mediaType = (sdpLines[i].split('m=')[1] || '').split(' ')[0];
          } else if (sdpLines[i].indexOf('a=rtpmap:') === 0) {
            if (['audio', 'video'].indexOf(mediaType) === -1) {
              continue;
            }
            var parts = (sdpLines[i].split(' ')[1] || '').split('/');
            var codec = (parts[0] || '').toLowerCase();
            var info = parts[1] + (parts[2] ? '/' + parts[2] : '');

            self._currentCodecSupport[mediaType][codec] = info;
          }
        }

        callback(null);

      }, function (error) {
        callback(error);
      }, offerConstraints);
    }
  } catch (error) {
    callback(error);
  }
};

/**
 * Function that modifies the session description to handle the connection settings.
 * This is experimental and never recommended to end-users.
 * @method _handleSDPConnectionSettings
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._handleSDPConnectionSettings = function (targetMid, sessionDescription, direction) {
  var self = this;

  if (!self._sdpSessions[targetMid]) {
    return sessionDescription.sdp;
  }

  var sessionDescriptionStr = sessionDescription.sdp;

  if (direction === 'remote' && !self.getPeerInfo(targetMid).config.enableIceTrickle) {
    sessionDescriptionStr = sessionDescriptionStr.replace(/a=end-of-candidates\r\n/g, '');
  }

  var sdpLines = sessionDescriptionStr.split('\r\n');
  var peerAgent = ((self._peerInformations[targetMid] || {}).agent || {}).name || '';
  var mediaType = '';
  var bundleLineIndex = -1;
  var bundleLineMids = [];
  var mLineIndex = -1;
  var settings = clone(self._sdpSettings);

  if (targetMid === 'MCU') {
    settings.connection.audio = true;
    settings.connection.video = true;
    settings.connection.data = true;
  }

  if (settings.connection.video) {
    settings.connection.video = (window.webrtcDetectedBrowser === 'edge' && peerAgent !== 'edge') ||
      (['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1 && peerAgent === 'edge') ?
      !!self._currentCodecSupport.video.h264 : true;
  }

  if (self._hasMCU) {
    settings.direction.audio.receive = targetMid === 'MCU' ? false : true;
    settings.direction.audio.send = targetMid === 'MCU' ? true : false;
    settings.direction.video.receive = targetMid === 'MCU' ? false : true;
    settings.direction.video.send = targetMid === 'MCU' ? true : false;
  }

  // ANSWERER: Reject only the m= lines. Returned rejected m= lines as well.
  // OFFERER: Remove m= lines

  self._sdpSessions[targetMid][direction].mLines = [];
  self._sdpSessions[targetMid][direction].bundleLine = '';

  for (var i = 0; i < sdpLines.length; i++) {
    // Cache the a=group:BUNDLE line used for remote answer from Edge later
    if (sdpLines[i].indexOf('a=group:BUNDLE') === 0) {
      self._sdpSessions[targetMid][direction].bundleLine = sdpLines[i];
      bundleLineIndex = i;

    // Check if there's a need to reject m= line
    } else if (sdpLines[i].indexOf('m=') === 0) {
      mediaType = (sdpLines[i].split('m=')[1] || '').split(' ')[0] || '';
      mediaType = mediaType === 'application' ? 'data' : mediaType;
      mLineIndex++;

      self._sdpSessions[targetMid][direction].mLines[mLineIndex] = sdpLines[i];

      // Check if there is missing unsupported video codecs support and reject it regardles of MCU Peer or not
      if (!settings.connection[mediaType]) {
        log.log([targetMid, 'RTCSessionDesription', sessionDescription.type,
          'Removing rejected m=' + mediaType + ' line ->'], sdpLines[i]);

        // Check if answerer and we do not have the power to remove the m line if index is 0
        // Set as a=inactive because we do not have that power to reject it somehow..
        // first m= line cannot be rejected for BUNDLE
        if (self._peerConnectionConfig.bundlePolicy === self.BUNDLE_POLICY.MAX_BUNDLE &&
          bundleLineIndex > -1 && mLineIndex === 0 && (direction === 'remote' ?
          sessionDescription.type === this.HANDSHAKE_PROGRESS.OFFER :
          sessionDescription.type === this.HANDSHAKE_PROGRESS.ANSWER)) {
          log.warn([targetMid, 'RTCSessionDesription', sessionDescription.type,
            'Not removing rejected m=' + mediaType + ' line ->'], sdpLines[i]);
          settings.connection[mediaType] = true;
          if (['audio', 'video'].indexOf(mediaType) > -1) {
            settings.direction[mediaType].send = false;
            settings.direction[mediaType].receive = false;
          }
          continue;
        }

        if (window.webrtcDetectedBrowser === 'edge') {
          sdpLines.splice(i, 1);
          i--;
          continue;
        } else if (direction === 'remote' || sessionDescription.type === this.HANDSHAKE_PROGRESS.ANSWER) {
          var parts = sdpLines[i].split(' ');
          parts[1] = 0;
          sdpLines[i] = parts.join(' ');
          continue;
        }
      }
    }

    if (direction === 'remote' && sdpLines[i].indexOf('a=candidate:') === 0 &&
      !self.getPeerInfo(targetMid).config.enableIceTrickle) {
      if (sdpLines[i + 1] ? !(sdpLines[i + 1].indexOf('a=candidate:') === 0 ||
        sdpLines[i + 1].indexOf('a=end-of-candidates') === 0) : true) {
        log.info([targetMid, 'RTCSessionDesription', sessionDescription.type,
          'Appending end-of-candidates signal for non-trickle ICE connection.']);
        sdpLines.splice(i + 1, 0, 'a=end-of-candidates');
        i++;
      }
    }

    if (mediaType) {
      // Remove lines if we are rejecting the media and ensure unless (rejectVideoMedia is true), MCU has to enable those m= lines
      if (!settings.connection[mediaType]) {
        sdpLines.splice(i, 1);
        i--;

      // Store the mids session description
      } else if (sdpLines[i].indexOf('a=mid:') === 0) {
        bundleLineMids.push(sdpLines[i].split('a=mid:')[1] || '');

      // Configure direction a=sendonly etc for local sessiondescription
      }  else if (direction === 'local' && mediaType && ['audio', 'video'].indexOf(mediaType) > -1 &&
        ['a=sendrecv', 'a=sendonly', 'a=recvonly'].indexOf(sdpLines[i]) > -1) {

        if (settings.direction[mediaType].send && !settings.direction[mediaType].receive) {
          sdpLines[i] = sdpLines[i].indexOf('send') > -1 ? 'a=sendonly' : 'a=inactive';
        } else if (!settings.direction[mediaType].send && settings.direction[mediaType].receive) {
          sdpLines[i] = sdpLines[i].indexOf('recv') > -1 ? 'a=recvonly' : 'a=inactive';
        } else if (!settings.direction[mediaType].send && !settings.direction[mediaType].receive) {
        // MCU currently does not support a=inactive flag.. what do we do here?
          sdpLines[i] = 'a=inactive';
        }

        // Handle Chrome bundle bug. - See: https://bugs.chromium.org/p/webrtc/issues/detail?id=6280
        if (!self._hasMCU && window.webrtcDetectedBrowser !== 'firefox' && peerAgent === 'firefox' &&
          sessionDescription.type === self.HANDSHAKE_PROGRESS.OFFER && sdpLines[i] === 'a=recvonly') {
          log.warn([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Overriding any original settings ' +
            'to receive only to send and receive to resolve chrome BUNDLE errors.']);
          sdpLines[i] = 'a=sendrecv';
          settings.direction[mediaType].send = true;
          settings.direction[mediaType].receive = true;
        }
      }
    }

    // Remove weird empty characters for Edge case.. :(
    if (!(sdpLines[i] || '').replace(/\n|\r|\s|\ /gi, '')) {
      sdpLines.splice(i, 1);
      i--;
    }
  }

  // Fix chrome "offerToReceiveAudio" local offer not removing audio BUNDLE
  if (bundleLineIndex > -1) {
    if (self._peerConnectionConfig.bundlePolicy === self.BUNDLE_POLICY.MAX_BUNDLE) {
      sdpLines[bundleLineIndex] = 'a=group:BUNDLE ' + bundleLineMids.join(' ');
    // Remove a=group:BUNDLE line
    } else if (self._peerConnectionConfig.bundlePolicy === self.BUNDLE_POLICY.NONE) {
      sdpLines.splice(bundleLineIndex, 1);
    }
  }

  // Append empty space below
  if (window.webrtcDetectedBrowser !== 'edge') {
    if (!sdpLines[sdpLines.length - 1].replace(/\n|\r|\s/gi, '')) {
      sdpLines[sdpLines.length - 1] = '';
    } else {
      sdpLines.push('');
    }
  }

  log.info([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Handling connection lines and direction ->'], settings);

  return sdpLines.join('\r\n');
};

/**
 * Function that parses and retrieves the session description fingerprint.
 * @method _getSDPFingerprint
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._getSDPFingerprint = function (targetMid, sessionDescription, beSilentOnLogs) {
  var fingerprint = {
    fingerprint: null,
    fingerprintAlgorithm: null,
    derBase64: null
  };

  if (!(sessionDescription && sessionDescription.sdp)) {
    return fingerprint;
  }

  var sdpLines = sessionDescription.sdp.split('\r\n');

  for (var i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].indexOf('a=fingerprint') === 0) {
      var parts = sdpLines[i].replace('a=fingerprint:', '').split(' ');
      fingerprint.fingerprint = parts[1];
      fingerprint.fingerprintAlgorithm = parts[0];
      break;
    }
  }

  if (!beSilentOnLogs) {
    log.debug([targetMid, 'RTCSessionDesription', sessionDescription.type,
      'Parsing session description fingerprint ->'], fingerprint);
  }

  return fingerprint;
};
