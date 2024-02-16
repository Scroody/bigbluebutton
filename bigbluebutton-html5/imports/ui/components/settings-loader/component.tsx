import { useQuery } from '@apollo/client';
import React, { useContext, useEffect } from 'react';
import { getBigBlueButtonSettings, getBigBlueButtonSettingsResponse } from './queries';
import { setMeetingSettings } from '../../core/local-states/useMeetingSettings';
import MeetingClientSettings from '../../Types/meetingClientSettings';
import ClientStartup from '/client/clientStartup';
import { LoadingContext } from '../common/loading-screen/loading-screen-HOC/component';
import { defineMessages, useIntl } from 'react-intl';

declare global {
  interface Window {
    meetingClientSettings: MeetingClientSettings;
  }
}

const intlMessages = defineMessages({
  fetchingSettings: {
    id: 'app.meeting.fetchingSettings',
    description: 'fetching settings label',
  },
});

const SettingsLoader: React.FC = () => {
  const { loading, error, data } = useQuery<getBigBlueButtonSettingsResponse>(getBigBlueButtonSettings);
  const [allowToRender, setAllowToRender] = React.useState(false);
  const loadingContextInfo = useContext(LoadingContext);
  const intl = useIntl();
  useEffect(() => {
    loadingContextInfo.setLoading(true, intl.formatMessage(intlMessages.fetchingSettings));
  }, []);

  useEffect(() => {
    if (!loading && !error) {
      const settings = data?.meeting[0].clientSettings.clientSettingsJson;
      if (settings && Object.keys(settings).length > 0) {
        window.meetingClientSettings = JSON.parse(JSON.stringify(settings as unknown as MeetingClientSettings));
        setMeetingSettings(settings as unknown as MeetingClientSettings);
        setAllowToRender(true);
      }
    }
  }, [loading]);
  if (loading) return null;
  if (error) {
    loadingContextInfo.setLoading(false, '');
    throw new Error('Error on requesting meeting settings data: ', error);
  }
  return (
    (allowToRender)
      ? <ClientStartup />
      : null
  );
};

export default SettingsLoader;
