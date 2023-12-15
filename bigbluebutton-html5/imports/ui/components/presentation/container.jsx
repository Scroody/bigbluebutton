import React from 'react';
import PropTypes from 'prop-types';
import { notify } from '/imports/ui/services/notification';
import Presentation from '/imports/ui/components/presentation/component';
import PresentationToolbarService from './presentation-toolbar/service';
import Auth from '/imports/ui/services/auth';
import getFromUserSettings from '/imports/ui/services/users-settings';
import {
  layoutSelect,
  layoutSelectInput,
  layoutSelectOutput,
  layoutDispatch,
} from '../layout/context';
import WhiteboardService from '/imports/ui/components/whiteboard/service';
import { DEVICE_TYPE } from '../layout/enums';
import MediaService from '../media/service';
import { useSubscription } from '@apollo/client';
import {
  CURRENT_PRESENTATION_PAGE_SUBSCRIPTION,
  CURRENT_PAGE_WRITERS_SUBSCRIPTION,
} from '/imports/ui/components/whiteboard/queries';
import POLL_SUBSCRIPTION from '/imports/ui/core/graphql/queries/pollSubscription';
import useMeeting from '/imports/ui/core/hooks/useMeeting';
import useCurrentUser from '/imports/ui/core/hooks/useCurrentUser';
import useMeetingSettings from '/imports/ui/core/local-states/useMeetingSettings';

const PresentationContainer = (props) => {
  const [MeetingSettings] = useMeetingSettings();
  const appConfig = MeetingSettings.public.app;
  const preloadNextSlide = appConfig.preloadNextSlides;
  const fetchedpresentation = {};

  const { data: presentationPageData } = useSubscription(CURRENT_PRESENTATION_PAGE_SUBSCRIPTION);
  const { pres_page_curr: presentationPageArray } = (presentationPageData || {});
  const currentPresentationPage = presentationPageArray && presentationPageArray[0];
  const slideSvgUrl = currentPresentationPage && currentPresentationPage.svgUrl;

  const { data: whiteboardWritersData } = useSubscription(CURRENT_PAGE_WRITERS_SUBSCRIPTION);
  const whiteboardWriters = whiteboardWritersData?.pres_page_writers || [];

  const meeting = useMeeting((m) => ({
    lockSettings: m?.lockSettings,
  }));

  const isViewersAnnotationsLocked = meeting ? meeting.lockSettings?.hideViewersAnnotation : true;

  const multiUserData = {
    active: whiteboardWriters?.length > 0,
    size: whiteboardWriters?.length || 0,
    hasAccess: whiteboardWriters?.some((writer) => writer.userId === Auth.userID),
  };

  const { data: pollData } = useSubscription(POLL_SUBSCRIPTION);
  const poll = pollData?.poll[0] || {};

  const currentSlide = currentPresentationPage ? {
    content: currentPresentationPage.content,
    current: currentPresentationPage.isCurrentPage,
    height: currentPresentationPage.height,
    width: currentPresentationPage.width,
    id: currentPresentationPage.pageId,
    imageUri: slideSvgUrl,
    num: currentPresentationPage?.num,
    presentationId: currentPresentationPage?.presentationId,
    svgUri: slideSvgUrl,
  } : null;

  let slidePosition;
  if (currentSlide) {
    const { presentationId } = currentSlide;

    slidePosition = {
      height: currentPresentationPage.scaledHeight,
      id: currentPresentationPage.pageId,
      presentationId: currentPresentationPage.presentationId,
      viewBoxHeight: currentPresentationPage.scaledViewBoxHeight,
      viewBoxWidth: currentPresentationPage.scaledViewBoxWidth,
      width: currentPresentationPage.scaledWidth,
      x: currentPresentationPage.xOffset,
      y: currentPresentationPage.yOffset,
    };

    if (preloadNextSlide && !fetchedpresentation[presentationId]) {
      fetchedpresentation[presentationId] = {
        canFetch: true,
        fetchedSlide: {},
      };
    }
    const presentation = fetchedpresentation[presentationId];

    if (preloadNextSlide
      && !presentation.fetchedSlide[currentSlide.num + preloadNextSlide]
      && presentation.canFetch) {
      // TODO: preload next slides should be reimplemented in graphql
      const slidesToFetch = [currentPresentationPage];

      const promiseImageGet = slidesToFetch
        .filter((s) => !fetchedpresentation[presentationId].fetchedSlide[s.num])
        .map(async (slide) => {
          if (presentation.canFetch) presentation.canFetch = false;
          const image = await fetch(slide.svgUrl);
          if (image.ok) {
            presentation.fetchedSlide[slide.num] = true;
          }
        });
      Promise.all(promiseImageGet).then(() => {
        presentation.canFetch = true;
      });
    }
  }

  const { presentationIsOpen } = props;

  const cameraDock = layoutSelectInput((i) => i.cameraDock);
  const presentation = layoutSelectOutput((i) => i.presentation);
  const fullscreen = layoutSelect((i) => i.fullscreen);
  const deviceType = layoutSelect((i) => i.deviceType);
  const layoutContextDispatch = layoutDispatch();

  const { numCameras } = cameraDock;
  const { element } = fullscreen;
  const fullscreenElementId = 'Presentation';
  const fullscreenContext = (element === fullscreenElementId);

  const isIphone = !!(navigator.userAgent.match(/iPhone/i));

  const { data: currentUser } = useCurrentUser((user) => ({
    presenter: user.presenter,
  }));
  const userIsPresenter = currentUser?.presenter;

  const presentationAreaSize = {
    presentationAreaWidth: presentation?.width,
    presentationAreaHeight: presentation?.height,
  };

  return (
    <Presentation
      {
      ...{
        layoutContextDispatch,
        numCameras,
        ...props,
        userIsPresenter,
        presentationBounds: presentation,
        fullscreenContext,
        fullscreenElementId,
        isMobile: deviceType === DEVICE_TYPE.MOBILE,
        isIphone,
        currentSlide,
        slidePosition,
        downloadPresentationUri: `${appConfig.bbbWebBase}/${currentPresentationPage?.downloadFileUri}`,
        multiUser: (multiUserData.hasAccess || multiUserData.active) && presentationIsOpen,
        presentationIsDownloadable: currentPresentationPage?.downloadable,
        mountPresentation: !!currentSlide,
        currentPresentationId: currentPresentationPage?.presentationId,
        totalPages: currentPresentationPage?.totalPages || 0,
        notify,
        zoomSlide: PresentationToolbarService.zoomSlide,
        publishedPoll: poll?.published || false,
        restoreOnUpdate: getFromUserSettings(
          'bbb_force_restore_presentation_on_new_events',
          MeetingSettings.public.presentation.restoreOnUpdate,
        ),
        addWhiteboardGlobalAccess: WhiteboardService.addGlobalAccess,
        removeWhiteboardGlobalAccess: WhiteboardService.removeGlobalAccess,
        multiUserSize: multiUserData.size,
        isViewersAnnotationsLocked,
        setPresentationIsOpen: MediaService.setPresentationIsOpen,
        isDefaultPresentation: currentPresentationPage?.isDefaultPresentation,
        presentationName: currentPresentationPage?.presentationName,
        presentationAreaSize,
      }
      }
    />
  );
};

export default PresentationContainer;

PresentationContainer.propTypes = {
  presentationIsOpen: PropTypes.bool.isRequired,
};
