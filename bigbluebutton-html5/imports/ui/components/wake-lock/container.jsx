import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { withTracker } from 'meteor/react-meteor-data';
import WakeLock from './component';
import Service from './service';
import Settings from '/imports/ui/services/settings';
import getFromUserSettings from '/imports/ui/services/users-settings';
import useMeetingSettings from '/imports/ui/core/local-states/useMeetingSettings';

const propTypes = {
  areAudioModalsOpen: PropTypes.bool,
  autoJoin: PropTypes.bool.isRequired,
};

const defaultProps = {
  areAudioModalsOpen: false,
};

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const WakeLockContainer = (props) => {
  if (!Service.isMobile()) return null;

  const { areAudioModalsOpen, autoJoin } = props;
  const wereAudioModalsOpen = usePrevious(areAudioModalsOpen);
  const [endedAudioSetup, setEndedAudioSetup] = useState(false || !autoJoin);

  useEffect(() => {
    if (wereAudioModalsOpen && !areAudioModalsOpen && !endedAudioSetup) {
      setEndedAudioSetup(true);
    }
  }, [areAudioModalsOpen]);

  return endedAudioSetup ? <WakeLock {...props} /> : null;
};

WakeLockContainer.propTypes = propTypes;
WakeLockContainer.defaultProps = defaultProps;

export default withTracker(() => {
  const [MeetingSettings] = useMeetingSettings();
  const appConfig = MeetingSettings.public.app;

  return {
    request: Service.request,
    release: Service.release,
    wakeLockSettings: Settings.application.wakeLock,
    areAudioModalsOpen: Session.get('audioModalIsOpen') || Session.get('inEchoTest'),
    autoJoin: getFromUserSettings('bbb_auto_join_audio', appConfig.autoJoin),
  };
})(WakeLockContainer);
