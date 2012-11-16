<?php

namespace Likipe\HMACBundle;

use Symfony\Component\Security\Core\SecurityContextInterface;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

class AuthenticatedUserFactory
{
	public static function getUser(SecurityContextInterface $context)
	{
		$user = false;
		
		if(($tok = $context->getToken())) {
			$user = $tok->getUser();
		}
		
		if( ! $user) {
			throw new AccessDeniedException();
		}
		
		return $user;
	}
}